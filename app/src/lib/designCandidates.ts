import 'server-only'
import { completeText } from '@/lib/claude'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildPlanningContext, industryLabel } from '@/lib/questions'
import type { DesignReference } from '@/types/designReference'
import type { WizardAnswers } from '@/types/wizard'
import {
  SearchProfile,
  fallbackSearchProfile,
  parseSearchProfile,
  scoreReference,
  selectDiverse,
  fallbackDirectionName,
  parseCandidateLabels,
} from '@/lib/designMatch'

/** ユーザーに返すデザイン候補（参照サイト名は出さず、方向性で見せる） */
export interface DesignCandidate {
  referenceId: string
  name: string
  description: string
  features: string[]
  screenshotUrl?: string
  styleTags: string[]
}

/** publishedの参考デザインを取得（publishableキー+RLS経由なのでpublishedのみ返る） */
export async function fetchPublishedReferences(): Promise<DesignReference[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('design_references')
    .select('id, url, title, industry, style_tags, summary, analysis, status, created_at, updated_at')
    .limit(100)
  if (error) {
    console.error('design_references fetch failed:', error.code, error.message)
    return []
  }
  return (data ?? []) as DesignReference[]
}

/** ウィザード回答をClaudeで検索プロファイルに正規化。失敗時はルールベース */
export async function normalizeSearchProfile(
  answers: WizardAnswers,
): Promise<SearchProfile> {
  const context = buildAnswerContext(answers)
  try {
    const raw = await completeText(
      context,
      `あなたはWebデザイン検索の前処理を行うアシスタントです。
事業者のウィザード回答から、参考デザイン検索に使う情報を整理してください。
必ず以下のJSON形式のみで出力してください：
{
  "industry": "業種（回答の業界名をそのまま）",
  "purpose": "サイトの目的を1文で",
  "target": "ターゲット顧客を1文で",
  "impressions": ["希望する印象のキーワードを3〜6個（例: 高級感, 和風, 親しみやすい）"],
  "axes": {
    "luxury": "高級感 または 親しみやすさ",
    "era": "伝統的 または 現代的",
    "brightness": "明るい または 落ち着いている",
    "media": "写真中心 または 文字中心",
    "model": "店舗型 または サービス型 または 商品販売型"
  }
}
判断できない軸は省略してください。`,
    )
    const profile = parseSearchProfile(raw)
    if (profile?.industry) return profile
  } catch (e) {
    console.error('search profile normalization failed:', e instanceof Error ? e.message : e)
  }
  return fallbackProfile(answers)
}

function fallbackProfile(answers: WizardAnswers): SearchProfile {
  const profile = answers.profile ?? {}
  return fallbackSearchProfile({
    industryLabel: industryLabel(profile),
    tone: answers.step3?.tone,
    purpose: answers.cards?.['main-message']?.value,
    target: answers.cards?.['target-persona']?.value,
    hasEcommerce: answers.step4?.hasEcommerce,
    isStoreType: profile.businessType === 'store' || profile.businessType === 'both',
  })
}

function buildAnswerContext(answers: WizardAnswers): string {
  return `${buildPlanningContext(answers)}
ページ構成: ${answers.step4?.pages?.join(', ') ?? '未定'}
ネット販売: ${answers.step4?.hasEcommerce ? 'あり' : 'なし'}`
}

/** スコアリング + 多様性選抜で上位3件を選ぶ */
export function pickCandidates(
  profile: SearchProfile,
  references: DesignReference[],
): DesignReference[] {
  const scored = references.map((ref) => ({ ref, score: scoreReference(profile, ref) }))
  return selectDiverse(scored, 3).map((s) => s.ref)
}

/** 候補に初心者向けの名称・説明を付ける。Claude失敗時はタグから命名 */
export async function labelCandidates(
  picked: DesignReference[],
  profile: SearchProfile,
): Promise<DesignCandidate[]> {
  const labels = await generateLabels(picked, profile)
  return picked.map((ref, i) => ({
    referenceId: ref.id,
    name: labels?.[i]?.name ?? fallbackDirectionName(ref.style_tags),
    description: labels?.[i]?.description ?? ref.summary,
    features: labels?.[i]?.features?.length
      ? labels[i].features
      : ref.style_tags.slice(0, 3),
    screenshotUrl: ref.analysis?.screenshotUrl,
    styleTags: ref.style_tags,
  }))
}

async function generateLabels(picked: DesignReference[], profile: SearchProfile) {
  const items = picked
    .map(
      (r, i) => `候補${i + 1}:
タグ: ${r.style_tags.join(', ')}
トーン: ${r.analysis?.tone ?? ''}
配色: ${r.analysis?.colorScheme ?? ''}
概要: ${r.summary}`,
    )
    .join('\n\n')
  try {
    const raw = await completeText(
      `ユーザーの希望: 業種=${profile.industry} / 印象=${profile.impressions.join(', ')}

${items}`,
      `あなたはWeb制作初心者に向けてデザインの方向性を説明するアシスタントです。
各候補について、サイト名を出さずに「どんなデザインなのか」が分かる情報を作ってください。
名称の例: 「伝統と上品さを重視」「自然で親しみやすい」「現代的ですっきり」
必ず候補と同じ数・同じ順序のJSON配列のみで出力してください：
[{ "name": "デザイン方向性の名称（15字以内）", "description": "初心者向けの説明（2〜3文）", "features": ["主な特徴を3点"] }]`,
    )
    return parseCandidateLabels(raw, picked.length)
  } catch (e) {
    console.error('candidate labeling failed:', e instanceof Error ? e.message : e)
    return null
  }
}
