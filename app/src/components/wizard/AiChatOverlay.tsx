'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import { ChatMessage } from '@/lib/claude'

/** id を変えて渡すたびに、そのトピックでチャットが開いて相談が始まる */
export interface ConsultRequest {
  id: number
  topic: string
}

interface AiChatOverlayProps {
  systemContext: string
  consultRequest?: ConsultRequest | null
}

export function AiChatOverlay({ systemContext, consultRequest }: AiChatOverlayProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const handledConsultId = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!consultRequest || consultRequest.id === handledConsultId.current) return
    handledConsultId.current = consultRequest.id
    setOpen(true)
    sendMessage(
      `「${consultRequest.topic}」という質問にうまく答えられません。一緒に考えてもらえますか？`,
    )
    // sendMessage は毎レンダーで再生成されるため deps に含めず、id の重複ガードで多重送信を防ぐ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultRequest])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: next, systemContext }),
    })

    if (!res.body) { setLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let assistantText = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      assistantText += decoder.decode(value, { stream: true })
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: assistantText }
        return updated
      })
    }
    setLoading(false)
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
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8">
                  わからないことを<br />自由に聞いてください
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {m.content}
                  </div>
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
