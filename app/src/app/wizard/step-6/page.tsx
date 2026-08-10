'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { PreGenerationCheck } from '@/components/wizard/PreGenerationCheck'
import { Button } from '@/components/ui/Button'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'
import { renderSiteBundle } from '@/lib/site/exportHtml'
import { FontPicker } from '@/components/wizard/FontPicker'
import { SiteEditPanel, type SelectedSection } from '@/components/wizard/SiteEditPanel'
import type { SiteData, SiteFontId } from '@/types/site'

const STAGE_LABELS: Record<string, string> = {
  design: 'デザインを設計しています…',
  content: 'ページの構成と文章を作っています…',
  validate: '仕上げの確認をしています…',
}

/** placeholder のままの画像から「用意すると良い写真」の一覧を作る */
function collectPhotoSuggestions(site: SiteData): string[] {
  const intents = new Set<string>()
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk)
    if (typeof value !== 'object' || value === null) return
    const obj = value as Record<string, unknown>
    if (obj.type === 'placeholder' && typeof obj.intent === 'string') {
      intents.add(obj.intent)
      return
    }
    Object.values(obj).forEach(walk)
  }
  site.pages.forEach((p) => p.sections.forEach((s) => walk(s.props)))
  return [...intents].slice(0, 8)
}

export default function Step6Page() {
  const router = useRouter()
  const { answers } = useWizardState()
  const [generating, setGenerating] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [previewKey, setPreviewKey] = useState(0)
  const [mobileView, setMobileView] = useState(false)
  const [selectedSection, setSelectedSection] = useState<SelectedSection | null>(null)
  const [undoStack, setUndoStack] = useState<SiteData[]>([])
  const previewRef = useRef<HTMLIFrameElement>(null)

  const site = answers.step6?.site
  const photoSuggestions = useMemo(() => (site ? collectPhotoSuggestions(site) : []), [site])

  // プレビュー（iframe）でクリックされたセクションを受け取る
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'site-preview-select' || !e.data.sectionId) return
      const current = loadWizardState().answers.step6?.site
      const section = current?.pages
        .flatMap((p) => p.sections)
        .find((s) => s.id === e.data.sectionId)
      if (!section) return
      const p = section.props as Record<string, unknown>
      const hint =
        (typeof p.title === 'string' && p.title) ||
        (typeof p.siteName === 'string' && p.siteName) ||
        ''
      setSelectedSection({
        id: section.id,
        label: hint ? `「${hint}」のセクション` : section.component,
      })
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  function clearSelection() {
    setSelectedSection(null)
    previewRef.current?.contentWindow?.postMessage(
      { type: 'site-preview-clear-selection' },
      '*',
    )
  }

  /** 編集・Undo共通：サイトを保存してプレビューを更新する */
  function saveSite(updated: SiteData) {
    let state = loadWizardState()
    state = updateStepAnswers(state, 'step6', { site: updated })
    saveWizardState(state)
    setSelectedSection(null)
    setPreviewKey((k) => k + 1)
  }

  function handleEditApplied(updated: SiteData) {
    if (site) setUndoStack((stack) => [...stack.slice(-9), site])
    saveSite(updated)
  }

  function handleUndo() {
    const prev = undoStack[undoStack.length - 1]
    if (!prev) return
    setUndoStack((stack) => stack.slice(0, -1))
    saveSite(prev)
  }

  async function generate() {
    setGenerating(true)
    setError('')
    setStage(STAGE_LABELS.design)
    try {
      const res = await fetch('/api/site/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.body) throw new Error('empty body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let received: SiteData | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as {
            type: string
            stage?: string
            site?: SiteData
            message?: string
          }
          if (event.type === 'stage' && event.stage) {
            setStage(STAGE_LABELS[event.stage] ?? event.stage)
          } else if (event.type === 'site' && event.site) {
            received = event.site
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }

      if (!received) throw new Error('no site data')

      let state = loadWizardState()
      state = updateStepAnswers(state, 'step6', { site: received })
      state = markStepComplete(state, 6)
      saveWizardState(state)
      setUndoStack([])
      setSelectedSection(null)
      setPreviewKey((k) => k + 1)
    } catch (e) {
      setError(e instanceof Error && e.message !== 'no site data' && e.message !== 'empty body'
        ? e.message
        : '生成に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setGenerating(false)
      setStage('')
    }
  }

  /** フォント選択をサイトデータへ反映し、プレビューを再読み込みする */
  function changeFont(target: 'headingFont' | 'bodyFont', id: SiteFontId) {
    let state = loadWizardState()
    const current = state.answers.step6?.site
    if (!current) return
    const updated: SiteData = {
      ...current,
      designTokens: {
        ...current.designTokens,
        typography: { ...current.designTokens.typography, [target]: id },
      },
    }
    state = updateStepAnswers(state, 'step6', { site: updated })
    saveWizardState(state)
    setPreviewKey((k) => k + 1)
  }

  async function downloadHtml() {
    if (!site) return
    const files = await renderSiteBundle(site)
    for (const file of files) {
      const blob = new Blob([file.html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <StepLayout
      stepId={6}
      title="サイト生成"
      why="STEP 1〜5で整理した情報をもとに、AIがデザインとページ構成を設計し、サイトを組み立てます。写真が足りない部分は、入れるべき写真の提案付きのプレースホルダーになります。"
      onNext={site ? () => router.push('/wizard/step-7') : undefined}
      nextLabel="公開手順へ"
      prevHref="/wizard/design"
    >
      <PreGenerationCheck answers={answers} />

      <Button onClick={generate} disabled={generating} className="w-full py-3">
        {generating ? stage || '生成中…' : site ? 'サイトを作り直す' : 'サイトを生成する'}
      </Button>

      {generating && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-sub">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-500" />
          {stage}（30秒〜1分ほどかかります）
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {site && !generating && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">プレビュー</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileView(false)}
                className={`rounded-full px-3 py-1 text-xs ${!mobileView ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
              >
                PC
              </button>
              <button
                onClick={() => setMobileView(true)}
                className={`rounded-full px-3 py-1 text-xs ${mobileView ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
              >
                スマホ
              </button>
              <a href="/editor" className="ml-2 text-xs font-medium text-accent-700 underline">
                🎨 エディタで編集
              </a>
              <a
                href="/preview"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-700 underline"
              >
                別タブで開く
              </a>
              <button onClick={downloadHtml} className="text-xs text-accent-700 underline">
                HTMLをダウンロード
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <iframe
              key={previewKey}
              ref={previewRef}
              src="/preview?select=1"
              title="サイトプレビュー"
              className="mx-auto block h-[560px] bg-white"
              style={{ width: mobileView ? 390 : '100%' }}
            />
          </div>

          <SiteEditPanel
            site={site}
            selectedSection={selectedSection}
            onClearSelection={clearSelection}
            onApplied={handleEditApplied}
            canUndo={undoStack.length > 0}
            onUndo={handleUndo}
          />

          <FontPicker site={site} onSelect={changeFont} />

          {photoSuggestions.length > 0 && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="mb-2 text-sm font-medium text-ink">
                📷 この写真を用意すると、サイトがさらに良くなります
              </p>
              <ul className="flex flex-col gap-1 text-xs text-sub">
                {photoSuggestions.map((intent) => (
                  <li key={intent}>・{intent}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted">
                STEP 5 で写真をアップロードして再生成すると、その場所に実際の写真が入ります
              </p>
            </div>
          )}
        </div>
      )}
    </StepLayout>
  )
}
