'use client'

// Showcase 用の単体表示ページ。iframe の中身として使う。
// ?c=HeroSplit … カタログの defaults でコンポーネント1つを表示
// ?sample=shinise … サンプルサイト構成をまるごと表示
// ?preset=washoku-dark … トークン preset の切り替え

import { Suspense, createElement } from 'react'
import { useSearchParams } from 'next/navigation'
import { CATALOG_BY_NAME } from '@/lib/site/catalog'
import { SAMPLE_SITES } from '@/lib/site/sampleSites'
import {
  googleFontsHref,
  SITE_BASE_CSS,
  SITE_FONTS,
  TOKEN_PRESETS,
  tokensToCssVars,
  type TokenPresetId,
} from '@/lib/site/tokens'
import type { SiteFontId } from '@/types/site'
import { SITE_COMPONENTS } from '@/components/site'
import { SitePageRenderer } from '@/components/site/SiteRenderer'

function ViewInner() {
  const params = useSearchParams()

  const sampleKey = params.get('sample')
  if (sampleKey && SAMPLE_SITES[sampleKey]) {
    const site = SAMPLE_SITES[sampleKey].site
    return <SitePageRenderer site={site} page={site.pages[0]} />
  }

  const name = params.get('c') ?? ''
  const def = CATALOG_BY_NAME[name]
  const Component = SITE_COMPONENTS[name]
  if (!def || !Component) {
    return <p className="p-8 text-sm">?c=コンポーネント名 を指定してください</p>
  }

  const presetParam = params.get('preset') as TokenPresetId | null
  const base =
    presetParam && TOKEN_PRESETS[presetParam]
      ? TOKEN_PRESETS[presetParam]
      : TOKEN_PRESETS['shinise-warm']

  // ?hf= / ?bf= でフォントを上書きして確認できる（QA用）
  const hf = params.get('hf') as SiteFontId | null
  const bf = params.get('bf') as SiteFontId | null
  const tokens =
    (hf && SITE_FONTS[hf]) || (bf && SITE_FONTS[bf])
      ? {
          ...base,
          typography: {
            ...base.typography,
            ...(hf && SITE_FONTS[hf] ? { headingFont: hf } : {}),
            ...(bf && SITE_FONTS[bf] ? { bodyFont: bf } : {}),
          },
        }
      : base

  return (
    <div className="site-root min-h-screen" style={tokensToCssVars(tokens)}>
      <link rel="stylesheet" href={googleFontsHref(tokens)} />
      <style dangerouslySetInnerHTML={{ __html: SITE_BASE_CSS }} />
      {createElement(Component as never, {
        sectionId: `showcase-${name}`,
        ...def.defaults,
      } as never)}
    </div>
  )
}

export default function ShowcaseViewPage() {
  return (
    <Suspense fallback={null}>
      <ViewInner />
    </Suspense>
  )
}
