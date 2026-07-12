// Claudeの応答からJSONを取り出す共通処理。
// コードフェンスや前後の説明文が混ざるケースに対応するため、
// 最初の { / [ から最後の } / ] までを対象にする

export function extractJson(text: string): unknown | null {
  const starts = [text.indexOf('{'), text.indexOf('[')].filter((i) => i !== -1)
  if (starts.length === 0) return null
  const start = Math.min(...starts)
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'))
  if (end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

export const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

export const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []
