import 'server-only'
import { completeText } from '@/lib/claude'
import {
  AnalysisResult,
  extractHtmlTitle,
  extractPageText,
  parseAnalysisJson,
} from '@/lib/referenceAnalysis'

const SYSTEM_PROMPT = `あなたはWebデザインの参考事例を分析するアシスタントです。
提供されたWebサイトのタイトルと本文テキストから、デザイン・マーケティングの観点で分析してください。
必ず以下のJSON形式のみで出力してください（説明文は不要）：
{
  "title": "サイト名",
  "industry": "業界（飲食店 / 小売・物販 / 食品・農産物の生産販売 / 美容・サロン / 宿泊・観光 / 教室・スクール / 士業・専門サービス / 製造業 / その他 のいずれか）",
  "styleTags": ["デザインの特徴タグを3〜6個（例: ミニマル, 和風, 高級感, 写真主体）"],
  "summary": "このサイトの魅力と参考ポイントを2〜3文で",
  "analysis": {
    "colorScheme": "配色の特徴",
    "layout": "レイアウトの特徴",
    "typography": "文字・フォントの印象",
    "tone": "全体のトーン・世界観",
    "targetAudience": "想定される顧客層",
    "takeaways": ["初心者が真似できるポイントを2〜4個"]
  }
}`

async function fetchSiteHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebSupportBot/1.0)' },
    redirect: 'follow',
  })
  if (!res.ok) {
    throw new Error(`サイトを取得できませんでした（HTTP ${res.status}）`)
  }
  return res.text()
}

export async function analyzeReferenceSite(
  url: string,
): Promise<AnalysisResult> {
  const html = await fetchSiteHtml(url)
  const title = extractHtmlTitle(html)
  const text = extractPageText(html)
  if (!text) {
    throw new Error('サイトから分析できるテキストを取得できませんでした')
  }

  const userContent = `URL: ${url}\nタイトル: ${title}\n本文テキスト:\n${text}`
  const raw = await completeText(userContent, SYSTEM_PROMPT)
  const result = parseAnalysisJson(raw)
  if (!result) {
    throw new Error('AIの分析結果を解析できませんでした')
  }
  // Claudeがtitleを返さなかった場合はHTMLのtitleで補完する
  if (!result.title) result.title = title || url
  return result
}
