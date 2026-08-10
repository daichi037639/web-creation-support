'use client'

// 生成サイトのプレビュー。STEP 6 の iframe と「別タブで開く」の両方から使う。
// サイトデータは localStorage（wizard_state の step6.site）か、?sample= から読む。
// ?select=1 のとき「クリックでセクション選択」モードになり、親ウィンドウへ
// postMessage で選択中の section ID を通知する（AI編集の対象指定に使う）

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SiteData } from '@/types/site'
import { useWizardState } from '@/lib/useWizardState'
import { SAMPLE_SITES } from '@/lib/site/sampleSites'
import { SitePageRenderer } from '@/components/site/SiteRenderer'

const SELECT_MODE_CSS = `
[data-sid] { cursor: pointer; }
[data-sid]:hover { outline: 2px dashed rgb(0 153 255 / 0.6); outline-offset: -2px; }
[data-sid].preview-selected { outline: 3px solid #0099ff; outline-offset: -3px; }
`

function PreviewInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { answers } = useWizardState()
  const selectMode = params.get('select') === '1'
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sampleKey = params.get('sample')
  const site: SiteData | undefined = useMemo(() => {
    if (sampleKey && SAMPLE_SITES[sampleKey]) return SAMPLE_SITES[sampleKey].site
    return (answers.step6 as { site?: SiteData } | undefined)?.site
  }, [sampleKey, answers.step6])

  // 親（STEP 6）からの選択解除を受け取る
  useEffect(() => {
    if (!selectMode) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'site-preview-clear-selection') setSelectedId(null)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [selectMode])

  // 選択中セクションのハイライト
  useEffect(() => {
    document.querySelectorAll('.preview-selected').forEach((el) =>
      el.classList.remove('preview-selected'),
    )
    if (selectedId) {
      document.querySelector(`[data-sid="${selectedId}"]`)?.classList.add('preview-selected')
    }
  }, [selectedId])

  if (!site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-8 text-center text-sm text-muted">
        まだサイトが生成されていません。STEP 6 で「サイトを生成する」を押してください。
      </div>
    )
  }

  const slug = params.get('page') ?? 'home'
  const page = site.pages.find((p) => p.slug === slug) ?? site.pages[0]

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement

    // 選択モード：クリックしたセクションを選択して親へ通知（リンク遷移は抑止）
    if (selectMode) {
      const wrapper = target.closest('[data-sid]')
      if (wrapper) {
        e.preventDefault()
        e.stopPropagation()
        const sectionId = wrapper.getAttribute('data-sid')
        setSelectedId(sectionId)
        window.parent?.postMessage({ type: 'site-preview-select', sectionId }, '*')
      }
      return
    }

    // 通常モード："/slug" へのリンクをプレビュー内遷移に変換する
    const anchor = target.closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href') ?? ''
    if (href.startsWith('/')) {
      e.preventDefault()
      const dest = href.slice(1)
      const query = new URLSearchParams(params.toString())
      query.set('page', site!.pages.some((p) => p.slug === dest) ? dest : 'home')
      router.replace(`/preview?${query.toString()}`)
      window.scrollTo(0, 0)
    }
  }

  return (
    <div onClickCapture={handleClick}>
      {selectMode && <style dangerouslySetInnerHTML={{ __html: SELECT_MODE_CSS }} />}
      <SitePageRenderer site={site} page={page} />
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <PreviewInner />
    </Suspense>
  )
}
