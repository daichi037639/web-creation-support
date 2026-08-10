// SiteData を実際の画面に描画する Renderer。
// クライアントプレビュー（/preview）と静的書き出し（lib/site/export.ts）の両方が
// これを使うため、hooks・context は使わない

import { createElement } from 'react'
import type { AssetReference, SiteAsset, SiteData, SitePage, SiteSection } from '@/types/site'
import { CATALOG_BY_NAME } from '@/lib/site/catalog'
import {
  googleFontsHref,
  rootDecorAttrs,
  sectionWrapperProps,
  SITE_BASE_CSS,
  tokensToCssVars,
} from '@/lib/site/tokens'
import { SITE_COMPONENTS } from '@/components/site'

/** {type:'material'} を実URLへ解決する。見つからなければ placeholder に落とす */
function resolveImage(ref: unknown, assets: SiteAsset[]): AssetReference | undefined {
  const r = ref as AssetReference | undefined
  if (!r || typeof r !== 'object') return undefined
  if (r.type === 'material') {
    const asset = assets.find((a) => a.id === r.id)
    if (asset) return { type: 'url', url: asset.url, alt: asset.caption }
    return { type: 'placeholder', aspectRatio: '4/3', intent: '写真' }
  }
  return r
}

/** カタログの field 定義に沿って props 内の画像参照を解決し、nav 等を注入する */
export function prepareSectionProps(
  section: SiteSection,
  site: SiteData,
  nav: { label: string; href: string }[],
): Record<string, unknown> {
  const def = CATALOG_BY_NAME[section.component]
  const props: Record<string, unknown> = { ...section.props }
  if (!def) return props

  for (const [key, spec] of Object.entries(def.fields)) {
    if (spec.kind === 'image') {
      props[key] = resolveImage(props[key], site.assets)
    } else if (spec.kind === 'items' && Array.isArray(props[key])) {
      props[key] = (props[key] as Record<string, unknown>[]).map((item) => {
        const out = { ...item }
        for (const [ik, ispec] of Object.entries(spec.item)) {
          if (ispec.kind === 'image') out[ik] = resolveImage(out[ik], site.assets)
        }
        return out
      })
    }
  }

  if (def.injects?.includes('nav')) props.nav = nav
  if (def.injects?.includes('siteName') && !props.siteName) props.siteName = site.brief.siteName
  return props
}

export function navForSite(site: SiteData): { label: string; href: string }[] {
  if (site.pages.length <= 1) return []
  return site.pages.map((p) => ({ label: p.title, href: `/${p.slug}` }))
}

export function SitePageRenderer({ site, page }: { site: SiteData; page: SitePage }) {
  const nav = navForSite(site)
  const tokens = site.designTokens
  return (
    <div className="site-root" style={tokensToCssVars(tokens)} {...rootDecorAttrs(tokens)}>
      {/* body 内でも stylesheet は読み込まれる。プレビューと書き出しで同一挙動 */}
      <link rel="stylesheet" href={googleFontsHref(tokens)} />
      <style dangerouslySetInnerHTML={{ __html: SITE_BASE_CSS }} />
      {page.sections.map((section) => {
        const Component = SITE_COMPONENTS[section.component]
        if (!Component) return null
        const props = prepareSectionProps(section, site, nav)
        // Style Props（LOG-013 Layer 1）はラッパー要素の data 属性と
        // CSS 変数上書きとして適用する。コンポーネント側は変更不要
        const { attrs, vars } = sectionWrapperProps(section.style, tokens)
        return (
          <div key={section.id} data-sid={section.id} {...attrs} style={vars as never}>
            {createElement(Component as never, {
              sectionId: section.id,
              ...props,
            } as never)}
          </div>
        )
      })}
    </div>
  )
}
