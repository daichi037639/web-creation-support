'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import type { CardUpdate } from '@/lib/claude'
import {
  CardProposal,
  StoredChatMessage,
  loadChatMessages,
  saveChatMessages,
  clearChatMessages,
} from '@/lib/chatStorage'
import { subscribeConsult } from '@/lib/consultBus'
import { getAllQuestions } from '@/lib/questions'
import { loadWizardState, saveWizardState, updateCards } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'

/** パスごとの「いまユーザーが何をしているか」。回答内容はAPI側でsystemプロンプトに注入される */
const STEP_CONTEXTS: [RegExp, string][] = [
  [/step-1/, 'ユーザーは今、事業・商品の棚卸しステップにいます。事業名・商品・強み・歴史をカード形式で整理しようとしています。'],
  [/step-2/, 'ユーザーは今、ターゲット顧客を整理するステップにいます。誰に届けたいか、その人の悩みや願望を言葉にしようとしています。'],
  [/step-3/, 'ユーザーは今、サイトで一番伝えたいメッセージとトーンを決めるステップにいます。'],
  [/step-4/, 'ユーザーは今、Webサイトのページ構成と必要な機能を決めるステップにいます。'],
  [/step-5/, 'ユーザーは今、Webサイトに載せるコンテンツ（文章・写真）を準備するステップにいます。'],
  [/design/, 'ユーザーは今、生成するサイトのデザインの方向性を選ぶステップにいます。デザインの違いや選び方について初心者向けに助言してください。'],
  [/step-6/, 'ユーザーは今、AIにサイトを生成させるステップにいます。生成されたサイトへの修正要望や疑問に答えてください。'],
  [/step-7/, 'ユーザーは今、完成したサイトをGitHubとVercelで公開するステップにいます。手順の疑問に答えてください。'],
]

type StreamEvent = { type: 'text'; text: string } | { type: 'updates'; updates: CardUpdate[] }

export function AiChatOverlay() {
  const pathname = usePathname()
  const { answers } = useWizardState()
  const [open, setOpen] = useState(false)
  // サーバーでは空、クライアントでは保存済み履歴から始める。
  // チャットは初期状態で閉じており履歴はDOMに出ないため、ハイドレーション差分は起きない
  const [messages, setMessages] = useState<StoredChatMessage[]>(() => loadChatMessages())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const stepContext =
    STEP_CONTEXTS.find(([pattern]) => pattern.test(pathname))?.[1] ??
    'ユーザーはWebサイト制作ウィザードを進めています。'

  const questionTitles = useMemo(() => {
    const map = new Map<string, string>()
    for (const q of getAllQuestions(answers.profile ?? {})) map.set(q.id, q.title)
    return map
  }, [answers.profile])

  // ストリーミング中の書き込み連発を避け、応答が確定したタイミングで保存する
  useEffect(() => {
    if (!loading) saveChatMessages(messages)
  }, [messages, loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 再レンダーごとにリスナーを張り替えず、常に最新のsendMessageを呼ぶためのref
  const sendRef = useRef<(text: string) => void>(() => {})
  useEffect(() => {
    sendRef.current = sendMessage
  })
  useEffect(() => {
    return subscribeConsult(({ topic }) => {
      setOpen(true)
      sendRef.current(`「${topic}」という質問にうまく答えられません。一緒に考えてもらえますか？`)
    })
  }, [])

  function handleEvent(event: StreamEvent, assistantText: { value: string }) {
    if (event.type === 'text') {
      assistantText.value += event.text
      const text = assistantText.value
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: text }
        return updated
      })
    } else if (event.type === 'updates') {
      const proposals: CardProposal[] = event.updates.map((u) => ({
        id: u.id,
        title: questionTitles.get(u.id) ?? u.id,
        value: u.value,
        applied: false,
      }))
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        updated[updated.length - 1] = {
          ...last,
          proposals: [...(last.proposals ?? []), ...proposals],
        }
        return updated
      })
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: StoredChatMessage = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 提案などの表示用データはAPIへ送らない（Claudeにはテキストの会話だけを渡す）
        messages: next.map(({ role, content }) => ({ role, content })),
        answers,
        stepContext,
      }),
    })

    if (!res.body) { setLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    const assistantText = { value: '' }
    let buffer = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          handleEvent(JSON.parse(line) as StreamEvent, assistantText)
        } catch {
          // 不完全な行はスキップ（次のチャンクで補完される）
        }
      }
    }
    setLoading(false)
  }

  function applyProposal(messageIndex: number, proposalIndex: number) {
    const proposal = messages[messageIndex]?.proposals?.[proposalIndex]
    if (!proposal || proposal.applied) return
    saveWizardState(
      updateCards(loadWizardState(), {
        [proposal.id]: { value: proposal.value, status: 'answered' },
      }),
    )
    setMessages((prev) =>
      prev.map((m, i) =>
        i === messageIndex
          ? {
              ...m,
              proposals: m.proposals?.map((p, j) =>
                j === proposalIndex ? { ...p, applied: true } : p,
              ),
            }
          : m,
      ),
    )
  }

  function clearHistory() {
    setMessages([])
    clearChatMessages()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white shadow-lg hover:bg-green-800 transition-colors"
        aria-label="AIに相談する"
      >
        💬
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-end">
          <div className="flex h-[70vh] w-full max-w-sm flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">AIに相談する</h2>
              <div className="flex items-center gap-3">
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-gray-400 hover:text-gray-600"
                  >
                    履歴を消す
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8">
                  わからないことを<br />自由に聞いてください
                  <br />
                  <span className="mt-2 block text-xs text-gray-300">
                    これまでの回答を踏まえてお答えします
                  </span>
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.content && (
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {m.content}
                      </div>
                    )}
                  </div>
                  {m.proposals && m.proposals.length > 0 && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-green-800">✏️ カードへの記入の提案</p>
                      {m.proposals.map((p, j) => (
                        <div key={j} className="rounded-lg bg-white p-2.5 ring-1 ring-green-100">
                          <p className="text-[11px] font-medium text-gray-500">{p.title}</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{p.value}</p>
                          <button
                            onClick={() => applyProposal(i, j)}
                            disabled={p.applied}
                            className={`mt-1.5 text-xs font-medium ${p.applied ? 'text-gray-400' : 'text-green-700 hover:text-green-900'}`}
                          >
                            {p.applied ? '✓ 反映しました' : 'カードに反映する'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t px-3 py-3 flex gap-2 items-end">
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="質問を入力..."
                rows={2}
                className="flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              />
              <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="shrink-0">
                送信
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
