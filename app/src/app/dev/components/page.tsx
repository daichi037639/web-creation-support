'use client'

// 開発用 Component Showcase。
// 全コンポーネントを Desktop / Tablet / Mobile の各幅で確認できる。
// メディアクエリを正しく効かせるため、各プレビューは iframe で表示する

import { useState } from 'react'
import {
  CATEGORY_LABELS,
  COMPONENT_CATALOG,
  type ComponentCategory,
} from '@/lib/site/catalog'
import { SAMPLE_SITES } from '@/lib/site/sampleSites'
import { TOKEN_PRESETS, type TokenPresetId } from '@/lib/site/tokens'

const VIEWPORTS = [
  { key: 'mobile', label: 'Mobile 390', width: 390, height: 640 },
  { key: 'tablet', label: 'Tablet 768', width: 768, height: 600 },
  { key: 'desktop', label: 'Desktop 1280', width: 1280, height: 600 },
] as const

export default function ComponentShowcasePage() {
  const [viewport, setViewport] = useState<(typeof VIEWPORTS)[number]>(VIEWPORTS[2])
  const [preset, setPreset] = useState<TokenPresetId>('shinise-warm')

  const categories = [...new Set(COMPONENT_CATALOG.map((d) => d.category))]

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-ink">Component Showcase（開発用）</h1>
          <p className="text-sm text-muted">
            生成サイト用 Component Library の全 {COMPONENT_CATALOG.length} コンポーネントを確認します
          </p>
        </header>

        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-3">
          <div className="flex gap-1">
            {VIEWPORTS.map((v) => (
              <button
                key={v.key}
                onClick={() => setViewport(v)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                  viewport.key === v.key ? 'bg-accent-500 text-white' : 'text-sub hover:bg-canvas'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(TOKEN_PRESETS) as TokenPresetId[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  preset === p ? 'bg-ink text-white' : 'text-sub hover:bg-canvas'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-ink">サンプル構成（複数セクション組み合わせ）</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(SAMPLE_SITES).map(([key, { label }]) => (
              <a
                key={key}
                href={`/preview?sample=${key}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent-700 hover:border-accent-300"
              >
                {label} →
              </a>
            ))}
          </div>
        </section>

        {categories.map((category) => (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-ink">
              {CATEGORY_LABELS[category as ComponentCategory]}
            </h2>
            <div className="flex flex-col gap-6">
              {COMPONENT_CATALOG.filter((d) => d.category === category).map((def) => (
                <div key={def.component} className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-mono text-sm font-semibold text-ink">{def.component}</h3>
                    <p className="text-xs text-muted">{def.use}</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-line bg-white p-3">
                    <iframe
                      title={def.component}
                      src={`/dev/components/view?c=${def.component}&preset=${preset}`}
                      width={viewport.width}
                      height={viewport.height}
                      loading="lazy"
                      className="mx-auto block rounded-lg border border-line-soft bg-white"
                      style={{ width: viewport.width, height: viewport.height }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
