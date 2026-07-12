import type { DesignReferenceAnalysis } from '@/types/designReference'

export interface AnalysisResult {
  title: string
  industry: string
  styleTags: string[]
  summary: string
  analysis: DesignReferenceAnalysis
}

// 分析対象URLの安全チェック。管理者専用APIだが、サーバーから
// 内部ネットワークへアクセスさせない（SSRF対策）
export function isSafePublicUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local')) return false
  // IPアドレス直指定（プライベート帯含む）は許可しない
  if (/^[0-9.]+$/.test(host) || host.includes(':')) return false
  return true
}

// HTMLからClaudeに渡すテキストを抽出する（script/style除去 + タグ除去）
export function extractPageText(html: string, maxLength = 8000): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  const text = withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, maxLength)
}

export function extractHtmlTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].replace(/\s+/g, ' ').trim() : ''
}

// Claudeの応答からJSONを取り出す。コードフェンス付き・前後に説明文が
// 混ざるケースがあるため、最初の { から最後の } までを対象にする
export function parseAnalysisJson(text: string): AnalysisResult | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const obj = parsed as Record<string, unknown>
  const analysis = (obj.analysis ?? {}) as Record<string, unknown>

  const asString = (v: unknown): string => (typeof v === 'string' ? v : '')
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []

  const result: AnalysisResult = {
    title: asString(obj.title),
    industry: asString(obj.industry),
    styleTags: asStringArray(obj.styleTags),
    summary: asString(obj.summary),
    analysis: {
      colorScheme: asString(analysis.colorScheme),
      layout: asString(analysis.layout),
      typography: asString(analysis.typography),
      tone: asString(analysis.tone),
      targetAudience: asString(analysis.targetAudience),
      takeaways: asStringArray(analysis.takeaways),
    },
  }
  // 最低限 industry と summary がなければ分析失敗とみなす
  if (!result.industry || !result.summary) return null
  return result
}
