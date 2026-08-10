'use client'

// 自然言語でサイトを部分修正するパネル（LOG-015 / P5b）。
// プレビューでセクションをクリックして対象を選び、要望を書くと
// AIが最小の変更だけを適用する（全再生成しない）

import { useState } from 'react'
import type { SiteData } from '@/types/site'
import { Button } from '@/components/ui/Button'

const SUGGESTIONS = [
  'もっと高級感のある雰囲気にして',
  '全体をもう少し明るくして',
  'この見出しをもっと短くして',
  'この部分をもっと目立たせて',
]

export interface SelectedSection {
  id: string
  label: string
}

export function SiteEditPanel({
  site,
  selectedSection,
  onClearSelection,
  onApplied,
  canUndo,
  onUndo,
}: {
  site: SiteData
  selectedSection: SelectedSection | null
  onClearSelection: () => void
  onApplied: (site: SiteData, message: string) => void
  canUndo: boolean
  onUndo: () => void
}) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function submit() {
    const request = input.trim()
    if (!request || busy) return
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/site/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site,
          request,
          selectedSectionId: selectedSection?.id,
        }),
      })
      const data = (await res.json()) as {
        applied: boolean
        message: string
        site?: SiteData
      }
      if (data.applied && data.site) {
        onApplied(data.site, data.message)
        setInput('')
        setMessage(data.message)
        setIsError(false)
      } else {
        setMessage(data.message || '変更できませんでした')
        setIsError(true)
      }
    } catch {
      setMessage('通信に失敗しました。もう一度お試しください。')
      setIsError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">💬 ことばで修正する</p>
        {canUndo && (
          <button onClick={onUndo} className="text-xs text-accent-700 underline">
            ↩ 元に戻す
          </button>
        )}
      </div>

      <p className="text-xs text-muted">
        プレビューの直したい場所をクリックして選んでから頼むと、その部分だけが変わります。
        選ばずに頼むと、AIが対象を判断します。
      </p>

      {selectedSection && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-xs text-accent-800">
            選択中: {selectedSection.label}
            <button onClick={onClearSelection} aria-label="選択を解除" className="font-bold">
              ×
            </button>
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="rounded-full border border-line bg-white px-3 py-1 text-[11px] text-sub hover:border-accent-300"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          }}
          placeholder="例：この写真をもっと大きくして"
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-400"
        />
        <Button onClick={submit} disabled={busy || !input.trim()} className="shrink-0">
          {busy ? '適用中…' : '修正する'}
        </Button>
      </div>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-xs ${
            isError ? 'bg-amber-50 text-amber-800' : 'bg-accent-50 text-accent-800'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
