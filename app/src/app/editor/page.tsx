'use client'

// Visual Editor（OSS版 Puck。LOG-016）。
// 左：追加できるコンポーネント / 中央：ドラッグ&ドロップで編集できるプレビュー /
// 右：選択中コンポーネントの設定。AI修正パネルは右下のオーバーレイ。
// source of truth は SiteData（wizard_state の step6.site）で、Puck は view

import '@measured/puck/puck.css'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Puck, type Data } from '@measured/puck'
import { loadWizardState, saveWizardState, updateStepAnswers } from '@/lib/storage'
import { puckDataToSite, siteToPuckData } from '@/lib/site/puckData'
import { buildPuckConfig, EditorSiteProvider } from '@/components/editor/puckConfig'
import { SiteEditPanel } from '@/components/wizard/SiteEditPanel'
import { Button } from '@/components/ui/Button'
import type { SiteData } from '@/types/site'

function persist(site: SiteData, notify = false) {
  let state = loadWizardState()
  state = updateStepAnswers(state, 'step6', { site })
  saveWizardState(state, { notify })
}

function EditorInner({ initial }: { initial: SiteData }) {
  const router = useRouter()
  const siteRef = useRef<SiteData>(initial)
  const [site, setSite] = useState(initial)
  // Puck に渡すデータのスナップショット。onChange のたびに再レンダーしないよう、
  // 再マウントが必要なとき（AI修正・ページ切替・Undo）だけ更新する
  const [snapshot, setSnapshot] = useState(initial)
  const [slug, setSlug] = useState(initial.pages[0]?.slug ?? 'home')
  const [version, setVersion] = useState(0)
  const [aiOpen, setAiOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<SiteData[]>([])

  const config = useMemo(() => buildPuckConfig(site), [site])
  const data = useMemo(() => siteToPuckData(snapshot, slug), [snapshot, slug])

  function handleChange(d: Data) {
    const updated = puckDataToSite(siteRef.current, slug, d)
    siteRef.current = updated
    persist(updated)
  }

  /** AI修正・Undo など、Puck の外からサイトを差し替える */
  function replaceSite(updated: SiteData) {
    siteRef.current = updated
    setSite(updated)
    setSnapshot(updated)
    persist(updated)
    setVersion((v) => v + 1)
  }

  function handleAiApplied(updated: SiteData) {
    setUndoStack((stack) => [...stack.slice(-9), site])
    replaceSite(updated)
  }

  function handleUndo() {
    const prev = undoStack[undoStack.length - 1]
    if (!prev) return
    setUndoStack((stack) => stack.slice(0, -1))
    replaceSite(prev)
  }

  function finish() {
    persist(siteRef.current, true)
    router.push('/wizard/step-6')
  }

  return (
    <EditorSiteProvider site={site}>
      <div className="flex h-screen flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
          <button onClick={finish} className="text-sm text-muted hover:text-ink">
            ← 戻る
          </button>
          <p className="text-sm font-semibold text-ink">{site.brief.siteName} の編集</p>
          <div className="flex items-center gap-1">
            {site.pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  setSnapshot(siteRef.current)
                  setSlug(p.slug)
                  setVersion((v) => v + 1)
                }}
                className={`rounded-full px-3 py-1 text-xs ${
                  slug === p.slug ? 'bg-ink text-white' : 'text-sub hover:bg-canvas'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAiOpen((o) => !o)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                aiOpen ? 'bg-accent-500 text-white' : 'border border-line text-sub hover:bg-canvas'
              }`}
            >
              💬 AIに修正を頼む
            </button>
            <Button onClick={finish} className="px-4 py-1.5 text-xs">
              保存して戻る
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1">
          <Puck
            key={`${slug}-${version}`}
            config={config}
            data={data}
            onChange={handleChange}
            onPublish={() => finish()}
            iframe={{ enabled: false }}
          />
        </div>

        {aiOpen && (
          <div className="fixed bottom-4 right-4 z-50 w-[26rem] max-w-[calc(100vw-2rem)] shadow-2xl">
            <SiteEditPanel
              site={site}
              selectedSection={null}
              onClearSelection={() => {}}
              onApplied={handleAiApplied}
              canUndo={undoStack.length > 0}
              onUndo={handleUndo}
            />
          </div>
        )}
      </div>
    </EditorSiteProvider>
  )
}

export default function EditorPage() {
  // localStorage は初回レンダー後にしか読めないため、遅延ロードする
  const [loaded, setLoaded] = useState(false)
  const [initial, setInitial] = useState<SiteData | null>(null)

  if (!loaded && typeof window !== 'undefined') {
    setInitial(loadWizardState().answers.step6?.site ?? null)
    setLoaded(true)
  }

  if (!loaded) return null
  if (!initial) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-sm text-muted">
        <p>まだサイトが生成されていません。</p>
        <a href="/wizard/step-6" className="text-accent-700 underline">
          STEP 6 でサイトを生成する →
        </a>
      </div>
    )
  }
  return <EditorInner initial={initial} />
}
