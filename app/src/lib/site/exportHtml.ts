// SiteData → 配布用の静的HTML。
// ブラウザ側で renderToStaticMarkup する（STEP 7 でユーザーが GitHub に
// アップロードするファイルをそのまま作る）。Tailwind はCDNランタイムで解決する

import { createElement } from 'react'
import type { SiteData } from '@/types/site'
import { googleFontsHref } from '@/lib/site/tokens'
import { SitePageRenderer } from '@/components/site/SiteRenderer'

export function filenameForSlug(slug: string): string {
  return slug === 'home' ? 'index.html' : `${slug}.html`
}

/** "/slug" 形式の内部リンクを静的ファイル名へ書き換える */
function rewriteInternalLinks(html: string, site: SiteData): string {
  let out = html
  for (const page of site.pages) {
    out = out.replaceAll(`href="/${page.slug}"`, `href="./${filenameForSlug(page.slug)}"`)
  }
  return out
}

export async function renderPageHtml(site: SiteData, slug: string): Promise<string> {
  // クライアントバンドルではブラウザ版 react-dom/server が解決される
  const { renderToStaticMarkup } = await import('react-dom/server')
  const page = site.pages.find((p) => p.slug === slug) ?? site.pages[0]
  const markup = renderToStaticMarkup(
    createElement(SitePageRenderer, { site, page }),
  )

  const title =
    page.slug === 'home'
      ? `${site.brief.siteName}｜${site.brief.tagline}`
      : `${page.title}｜${site.brief.siteName}`

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${site.brief.tagline}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${googleFontsHref(site.designTokens)}" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style>body { margin: 0; }</style>
</head>
<body>
${markup}
</body>
</html>
`
  return rewriteInternalLinks(html, site)
}

/** 全ページ分の {filename, html} を返す */
export async function renderSiteBundle(
  site: SiteData,
): Promise<{ filename: string; html: string }[]> {
  const files = []
  for (const page of site.pages) {
    files.push({
      filename: filenameForSlug(page.slug),
      html: await renderPageHtml(site, page.slug),
    })
  }
  return files
}
