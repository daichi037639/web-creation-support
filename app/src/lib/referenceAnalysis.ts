import type { DesignReferenceAnalysis } from '@/types/designReference'
import { extractJson, asString, asStringArray } from '@/lib/json'

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

export function parseAnalysisJson(text: string): AnalysisResult | null {
  const parsed = extractJson(text)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null
  }
  const obj = parsed as Record<string, unknown>
  const analysis = (obj.analysis ?? {}) as Record<string, unknown>

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
