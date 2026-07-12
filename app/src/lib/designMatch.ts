// 参考デザインの検索・スコアリング・多様性選抜。
// すべて pure 関数にして unit test 可能にする。
// 将来 embedding / pgvector 検索へ置き換える場合はこのモジュールだけ差し替える

import type { DesignReference } from '@/types/designReference'
import type { DesignBrief } from '@/types/wizard'
import { extractJson, asString, asStringArray } from '@/lib/json'

/** ユーザー回答から整理した検索プロファイル */
export interface SearchProfile {
  industry: string
  purpose: string
  target: string
  /** 希望する印象のキーワード（例: 高級感, 親しみやすい, 和風） */
  impressions: string[]
  axes: {
    luxury?: '高級感' | '親しみやすさ'
    era?: '伝統的' | '現代的'
    brightness?: '明るい' | '落ち着いている'
    media?: '写真中心' | '文字中心'
    model?: '店舗型' | 'サービス型' | '商品販売型'
  }
}

export interface ScoredReference {
  ref: DesignReference
  score: number
}

/** 軸のキーワード判定表。トーン自由入力のゆらぎを吸収する */
const AXIS_KEYWORDS: [RegExp, Partial<SearchProfile['axes']>][] = [
  [/高級|上質|上品|プレミアム|洗練/, { luxury: '高級感' }],
  [/親しみ|フレンドリー|気軽|カジュアル|アットホーム/, { luxury: '親しみやすさ' }],
  [/伝統|老舗|和風|歴史|レトロ|クラシック/, { era: '伝統的' }],
  [/現代|モダン|今風|スタイリッシュ|ミニマル/, { era: '現代的' }],
  [/明るい|元気|ポップ|カラフル|楽し/, { brightness: '明るい' }],
  [/落ち着|静か|シック|穏やか|大人/, { brightness: '落ち着いている' }],
  [/写真|ビジュアル|画像|ギャラリー/, { media: '写真中心' }],
]

/** Claudeでの正規化に失敗したとき用の、ルールベースの検索プロファイル */
export function fallbackSearchProfile(input: {
  industryLabel: string
  tone?: string
  purpose?: string
  target?: string
  hasEcommerce?: boolean
  isStoreType?: boolean
}): SearchProfile {
  const tone = input.tone ?? ''
  const axes: SearchProfile['axes'] = {}
  for (const [pattern, axis] of AXIS_KEYWORDS) {
    if (pattern.test(tone)) Object.assign(axes, axis)
  }
  axes.model = input.hasEcommerce
    ? '商品販売型'
    : input.isStoreType
      ? '店舗型'
      : 'サービス型'

  const impressions = tone
    .split(/[、,・\s/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 10)

  return {
    industry: input.industryLabel,
    purpose: input.purpose ?? '',
    target: input.target ?? '',
    impressions,
    axes,
  }
}

/** 参照1件のテキストをまとめて検索対象コーパスにする */
function referenceCorpus(ref: DesignReference): string {
  const a = ref.analysis ?? ({} as DesignReference['analysis'])
  return [
    ref.title,
    ref.summary,
    ...(ref.style_tags ?? []),
    a.tone,
    a.colorScheme,
    a.layout,
    a.typography,
    a.targetAudience,
    ...(a.takeaways ?? []),
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * 検索プロファイルと参照のマッチ度スコア。
 * 業種一致 > タグ一致 > 本文一致 の重み付け
 */
export function scoreReference(profile: SearchProfile, ref: DesignReference): number {
  let score = 0
  if (profile.industry && ref.industry === profile.industry) score += 40

  const corpus = referenceCorpus(ref)
  const tags = ref.style_tags ?? []
  const axisValues: string[] = Object.values(profile.axes).filter(
    (v): v is NonNullable<typeof v> => Boolean(v),
  )
  const keywords = [...profile.impressions, ...axisValues]
  for (const keyword of new Set(keywords)) {
    if (tags.some((t) => t.includes(keyword) || keyword.includes(t))) {
      score += 10
    } else if (corpus.includes(keyword)) {
      score += 4
    }
  }

  // ターゲット・目的の語が analysis や summary に現れたら加点
  for (const text of [profile.target, profile.purpose]) {
    for (const word of text.split(/[、。,\s]+/)) {
      if (word.length >= 2 && corpus.includes(word)) score += 2
    }
  }
  return score
}

/**
 * スコア上位から、既に選んだものとタグが重複しすぎる候補にペナルティを
 * かけながら n 件選ぶ（似たデザインばかりにしないための greedy 選抜）
 */
export function selectDiverse(scored: ScoredReference[], n = 3): ScoredReference[] {
  const remaining = [...scored].sort((a, b) => b.score - a.score)
  const selected: ScoredReference[] = []

  while (selected.length < n && remaining.length > 0) {
    const selectedTags = new Set(selected.flatMap((s) => s.ref.style_tags ?? []))
    let bestIndex = 0
    let bestValue = -Infinity
    remaining.forEach((candidate, i) => {
      const overlap = (candidate.ref.style_tags ?? []).filter((t) =>
        selectedTags.has(t),
      ).length
      const value = candidate.score - overlap * 12
      if (value > bestValue) {
        bestValue = value
        bestIndex = i
      }
    })
    selected.push(remaining.splice(bestIndex, 1)[0])
  }
  return selected
}

/** Claudeの命名に失敗したとき用の、タグからのルールベース命名 */
export function fallbackDirectionName(tags: string[]): string {
  const NAME_RULES: [RegExp, string][] = [
    [/和風|伝統|老舗/, '伝統と上品さを重視したデザイン'],
    [/高級|上質|上品/, '高級感が伝わる洗練されたデザイン'],
    [/ナチュラル|自然|やさし/, '自然で親しみやすいデザイン'],
    [/ミニマル|シンプル|モダン/, '現代的ですっきりしたデザイン'],
    [/信頼|誠実|堅実/, '信頼感が伝わる落ち着いたデザイン'],
    [/写真|ビジュアル/, '写真を主役にしたデザイン'],
    [/明るい|ポップ|カラフル/, '明るく元気な印象のデザイン'],
  ]
  for (const tag of tags) {
    for (const [pattern, name] of NAME_RULES) {
      if (pattern.test(tag)) return name
    }
  }
  return tags.length > 0 ? `${tags.slice(0, 2).join('・')}のデザイン` : 'おすすめのデザイン'
}

export function parseSearchProfile(text: string): SearchProfile | null {
  const parsed = extractJson(text)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null
  }
  const obj = parsed as Record<string, unknown>
  const axes = (obj.axes ?? {}) as Record<string, unknown>
  return {
    industry: asString(obj.industry),
    purpose: asString(obj.purpose),
    target: asString(obj.target),
    impressions: asStringArray(obj.impressions),
    axes: {
      luxury: pickAxis(axes.luxury, ['高級感', '親しみやすさ']),
      era: pickAxis(axes.era, ['伝統的', '現代的']),
      brightness: pickAxis(axes.brightness, ['明るい', '落ち着いている']),
      media: pickAxis(axes.media, ['写真中心', '文字中心']),
      model: pickAxis(axes.model, ['店舗型', 'サービス型', '商品販売型']),
    },
  }
}

function pickAxis<T extends string>(v: unknown, allowed: T[]): T | undefined {
  return allowed.includes(v as T) ? (v as T) : undefined
}

export interface CandidateLabel {
  name: string
  description: string
  features: string[]
}

export function parseCandidateLabels(text: string, count: number): CandidateLabel[] | null {
  const parsed = extractJson(text)
  if (!Array.isArray(parsed) || parsed.length < count) return null
  const labels = parsed.slice(0, count).map((item) => {
    const obj = (item ?? {}) as Record<string, unknown>
    return {
      name: asString(obj.name),
      description: asString(obj.description),
      features: asStringArray(obj.features).slice(0, 3),
    }
  })
  return labels.every((l) => l.name) ? labels : null
}

export function parseDesignBrief(text: string): DesignBrief | null {
  const parsed = extractJson(text)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null
  }
  const obj = parsed as Record<string, unknown>
  const brief: DesignBrief = {
    concept: asString(obj.concept),
    impression: asString(obj.impression),
    colorPalette: asStringArray(obj.colorPalette),
    typography: asString(obj.typography),
    firstView: asString(obj.firstView),
    layoutSpacing: asString(obj.layoutSpacing),
    photoTextRatio: asString(obj.photoTextRatio),
    sections: asString(obj.sections),
    cta: asString(obj.cta),
    mobile: asString(obj.mobile),
    avoid: asStringArray(obj.avoid),
  }
  return brief.concept && brief.colorPalette.length > 0 ? brief : null
}

/** デザイン設計書をサイト生成プロンプトに渡すテキストへ変換する */
export function briefToPromptText(brief: DesignBrief): string {
  return [
    '## デザイン設計書（必ず生成に反映すること）',
    `- コンセプト: ${brief.concept}`,
    `- 与えたい印象: ${brief.impression}`,
    `- カラーパレット: ${brief.colorPalette.join(' / ')}`,
    `- タイポグラフィ: ${brief.typography}`,
    `- ファーストビュー: ${brief.firstView}`,
    `- 余白・レイアウト: ${brief.layoutSpacing}`,
    `- 写真と文字の比率: ${brief.photoTextRatio}`,
    `- セクションの見せ方: ${brief.sections}`,
    `- ボタン・CTA: ${brief.cta}`,
    `- スマートフォン表示: ${brief.mobile}`,
    `- 避けるべき表現: ${brief.avoid.join(' / ')}`,
  ].join('\n')
}
