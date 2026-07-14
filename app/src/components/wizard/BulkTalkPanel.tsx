'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateCards } from '@/lib/storage'
import { BusinessProfile, CardAnswer } from '@/types/wizard'

interface Proposal {
  id: string
  title: string
  value: string
  selected: boolean
  overwrites: boolean
}

interface BulkTalkPanelProps {
  profile: BusinessProfile
  cards: Record<string, CardAnswer>
}

/**
 * 「まとめて話す」一括入力。事業のことを思いつくまま書いて（または音声入力して）もらい、
 * AIが各質問カードへ振り分ける。1問ずつ答えるより入力負荷が低い（LOG-009）
 */
export function BulkTalkPanel({ profile, cards }: BulkTalkPanelProps) {
  const [openPanel, setOpenPanel] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [notice, setNotice] = useState('')

  async function extract() {
    setLoading(true)
    setNotice('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, profile }),
      })
      const body = await res.json()
      if (!res.ok) {
        setNotice(body.error ?? '振り分けに失敗しました')
      } else if (body.updates.length === 0) {
        setNotice('カードに書ける内容が見つかりませんでした。もう少し詳しく書いてみてください')
      } else {
        setProposals(
          body.updates.map((u: { id: string; title: string; value: string }) => {
            const overwrites = cards[u.id]?.status === 'answered'
            // 入力済みカードは勝手に上書きせず、ユーザーがチェックを入れたときだけ反映する
            return { ...u, selected: !overwrites, overwrites }
          }),
        )
      }
    } catch {
      setNotice('通信に失敗しました。時間をおいて試してください')
    }
    setLoading(false)
  }

  function toggle(index: number) {
    setProposals((prev) =>
      prev?.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)) ?? null,
    )
  }

  function apply() {
    if (!proposals) return
    const selected = proposals.filter((p) => p.selected)
    if (selected.length === 0) return
    const updates: Record<string, CardAnswer> = {}
    for (const p of selected) updates[p.id] = { value: p.value, status: 'answered' }
    saveWizardState(updateCards(loadWizardState(), updates))
    setNotice(`✓ ${selected.length}枚のカードに反映しました`)
    setProposals(null)
    setText('')
  }

  if (!openPanel) {
    return (
      <button
        onClick={() => setOpenPanel(true)}
        className="flex w-full items-center justify-between rounded-xl border border-green-200 bg-green-50/60 px-4 py-3 text-left hover:bg-green-50"
      >
        <span>
          <span className="block text-sm font-semibold text-green-800">
            🎤 まとめて話して、AIにおまかせ
          </span>
          <span className="mt-0.5 block text-xs text-green-700">
            事業のことを思いつくまま書くだけで、AIがカードに振り分けます
          </span>
        </span>
        <span className="shrink-0 text-green-700">▼</span>
      </button>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-green-800">🎤 まとめて話して、AIにおまかせ</p>
          <p className="mt-0.5 text-xs text-green-700">
            商品のこと、お客さんのこと、こだわり、歴史…順番は気にせず、思いつくまま書いてください。
            AIが下の質問カードに振り分けます。
          </p>
        </div>
        <button onClick={() => setOpenPanel(false)} className="shrink-0 text-green-700">▲</button>
      </div>

      {proposals === null && (
        <>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="例：うちは祖父の代から70年続く茶農家で、農薬を使わずにお茶を育てています。買ってくれるのは健康に気をつかう40代くらいの女性が多くて、贈り物にもよく使われます。いちばん自慢なのは摘みたてをすぐ発送する新鮮さです…"
            hint="スマホなら、キーボードのマイクボタンで音声入力すると簡単です"
          />
          <Button onClick={extract} disabled={loading || !text.trim()} className="w-full">
            {loading ? 'AIが振り分けています…' : 'AIにカードへ振り分けてもらう'}
          </Button>
        </>
      )}

      {proposals !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-600">
            この内容でカードに記入します。修正したい場合は反映後にカードを直接編集できます
          </p>
          {proposals.map((p, i) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-green-100"
            >
              <input
                type="checkbox"
                checked={p.selected}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4 accent-green-700"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                  {p.title}
                  {p.overwrites && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                      入力済みを上書き
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-gray-800 whitespace-pre-wrap">{p.value}</span>
              </span>
            </label>
          ))}
          <div className="flex gap-2">
            <Button onClick={apply} disabled={!proposals.some((p) => p.selected)} className="flex-1">
              チェックしたカードに反映する
            </Button>
            <Button variant="ghost" onClick={() => setProposals(null)}>
              書き直す
            </Button>
          </div>
        </div>
      )}

      {notice && <p className="text-xs font-medium text-green-800">{notice}</p>}
    </section>
  )
}
