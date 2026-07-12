import 'server-only'
import { completeText } from '@/lib/claude'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildPlanningContext } from '@/lib/questions'
import { parseDesignBrief } from '@/lib/designMatch'
import type { DesignReference } from '@/types/designReference'
import type { DesignBrief, WizardAnswers } from '@/types/wizard'

const BRIEF_SYSTEM_PROMPT = `あなたはWebデザインの設計書を作るアシスタントです。
事業者の回答と、参考デザインの分析結果をもとに、サイト生成AIへ渡すデザイン設計書を作ってください。

重要なルール：
- 参考デザインからは「抽象化したデザイン原則」だけを取り入れる（配色の傾向・余白の使い方・トーンなど）
- 参考サイト固有の文章・ロゴ・画像・サイト名は一切含めない
- 参考サイトのレイアウトの完全な再現を指示しない
- ユーザーの事業内容・要望を最優先する

このサービスの実装ルール：
- Tailwind CSSを使う前提で色はカラーコードで指定する
- スマートフォンで見やすいことを最優先する
- Web初心者の事業者が自分で管理できるシンプルな構成にする

必ず以下のJSON形式のみで出力してください：
{
  "concept": "デザインコンセプトを1〜2文で",
  "impression": "ユーザー（訪問者）へ与えたい印象",
  "colorPalette": ["メイン・サブ・アクセント等のカラーコードと用途を3〜5個（例: #1B4332（メイン・見出しやボタン））"],
  "typography": "タイポグラフィ方針（書体の系統・見出しと本文の使い分け）",
  "firstView": "ファーストビューの方針（何を最初に見せるか）",
  "layoutSpacing": "余白・レイアウトの方針",
  "photoTextRatio": "写真と文字の比率の方針",
  "sections": "セクションごとの見せ方の方針",
  "cta": "CTA（問い合わせ・購入ボタン等）の見せ方",
  "mobile": "スマートフォン表示の方針",
  "avoid": ["避けるべき表現を2〜4個"]
}`

/** 参照IDからpublishedの参考デザインを1件取得（RLS適用） */
export async function fetchPublishedReference(
  referenceId: string,
): Promise<DesignReference | null> {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('design_references')
    .select('*')
    .eq('id', referenceId)
    .maybeSingle()
  return (data as DesignReference) ?? null
}

/**
 * デザイン設計書を生成する。参照が見つからない・生成に失敗した場合は
 * null を返し、呼び出し側は標準デザイン生成にフォールバックする
 */
export async function buildDesignBrief(
  answers: WizardAnswers,
  reference: DesignReference | null,
  directionName?: string,
): Promise<DesignBrief | null> {
  const referenceText = reference
    ? `## 参考デザインの分析（抽象化して取り入れる）
方向性: ${directionName ?? ''}
タグ: ${reference.style_tags.join(', ')}
配色: ${reference.analysis?.colorScheme ?? ''}
レイアウト: ${reference.analysis?.layout ?? ''}
文字: ${reference.analysis?.typography ?? ''}
トーン: ${reference.analysis?.tone ?? ''}
参考ポイント: ${(reference.analysis?.takeaways ?? []).join(' / ')}`
    : '## 参考デザインなし（回答内容から最適なデザインを提案する）'

  try {
    const raw = await completeText(
      `## 事業者の回答
${buildPlanningContext(answers)}

${referenceText}`,
      BRIEF_SYSTEM_PROMPT,
    )
    return parseDesignBrief(raw)
  } catch (e) {
    console.error('design brief generation failed:', e instanceof Error ? e.message : e)
    return null
  }
}
