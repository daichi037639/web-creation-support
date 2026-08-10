'use client'

// 生成後にユーザーがフォントを選び直すピッカー（LOG-014）。
// 各候補をそのフォント自身で描画するので、見た目で選べる。
// Google Fonts は unicode-range 分割配信のため、表示中の文字分しか
// ダウンロードされず、候補全読み込みでも実用上軽い

import { useState } from 'react'
import type { SiteData, SiteFontId } from '@/types/site'
import {
  BODY_FONT_IDS,
  googleFontsHrefFor,
  resolveFonts,
  SITE_FONT_IDS,
  SITE_FONTS,
} from '@/lib/site/tokens'

const KINDS = ['明朝', 'アンティーク', '筆・手書き', 'ゴシック', '丸ゴシック'] as const

function FontChip({
  id,
  selected,
  onSelect,
}: {
  id: SiteFontId
  selected: boolean
  onSelect: (id: SiteFontId) => void
}) {
  const font = SITE_FONTS[id]
  return (
    <button
      onClick={() => onSelect(id)}
      className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${
        selected
          ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-500'
          : 'border-line bg-white hover:border-accent-300'
      }`}
    >
      <span className="text-lg leading-snug" style={{ fontFamily: font.family }}>
        あア永 {font.label}
      </span>
      <span className="text-[10px] text-muted">{font.vibe}</span>
    </button>
  )
}

export function FontPicker({
  site,
  onSelect,
}: {
  site: SiteData
  /** target: 見出し or 本文 */
  onSelect: (target: 'headingFont' | 'bodyFont', id: SiteFontId) => void
}) {
  const [open, setOpen] = useState(false)
  const current = resolveFonts(site.designTokens.typography)

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink"
      >
        <span>
          🖋 フォントを変える
          <span className="ml-3 text-xs font-normal text-muted">
            見出し：{current.heading.label} ／ 本文：{current.body.label}
          </span>
        </span>
        <span className="text-muted">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-line p-4">
          {/* 候補フォントの読み込みはピッカーを開いたときだけ */}
          <link rel="stylesheet" href={googleFontsHrefFor(...SITE_FONT_IDS)} />

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-sub">見出しのフォント</p>
            {KINDS.map((kind) => {
              const ids = SITE_FONT_IDS.filter((id) => SITE_FONTS[id].kind === kind)
              if (ids.length === 0) return null
              return (
                <div key={kind} className="flex flex-col gap-1.5">
                  <p className="text-[10px] tracking-wider text-muted">{kind}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ids.map((id) => (
                      <FontChip
                        key={id}
                        id={id}
                        selected={current.headingId === id}
                        onSelect={(v) => onSelect('headingFont', v)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-sub">本文のフォント</p>
            <p className="text-[10px] text-muted">長い文章でも読みやすいフォントだけを表示しています</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BODY_FONT_IDS.map((id) => (
                <FontChip
                  key={id}
                  id={id}
                  selected={current.bodyId === id}
                  onSelect={(v) => onSelect('bodyFont', v)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
