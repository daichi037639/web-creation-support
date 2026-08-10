import 'server-only'

// Component-driven なサイト生成パイプライン。
// AI に HTML を書かせず、(1) Site Brief + Design Tokens、(2) ページ・セクション構成
// （どのコンポーネントに何の props を入れるか）だけを判断させる。
// 出力は必ず schema.ts の validation を通してから返す

import type Anthropic from '@anthropic-ai/sdk'
import { completeWithTool, completeWithToolLarge } from '@/lib/claude'
import { buildPlanningContext } from '@/lib/questions'
import { briefToPromptText } from '@/lib/designMatch'
import { materialKindLabel } from '@/lib/materials'
import {
  buildSiteContentToolSchema,
  buildSiteDesignToolSchema,
  buildTokensFromDesign,
  sanitizeBrief,
  validateSiteContent,
  type ValidationIssue,
} from '@/lib/site/schema'
import { COMPONENT_CATALOG } from '@/lib/site/catalog'
import { TOKEN_PRESETS } from '@/lib/site/tokens'
import type { SiteAsset, SiteBrief, SiteData, DesignTokens } from '@/types/site'
import type { WizardAnswers } from '@/types/wizard'

// ─────────────────────────────── 入力の整理

function buildHearingContext(answers: WizardAnswers): string {
  const a = answers
  const lines = [
    buildPlanningContext(a),
    '',
    `希望ページ構成: ${a.step4?.pages?.join(' / ') ?? '未定（AIが3〜4ページで提案する）'}`,
    `問い合わせフォーム: ${a.step4?.hasContactForm ? '必要' : '不要'}`,
    `予約機能: ${a.step4?.hasReservation ? '必要' : '不要'}`,
    `トップページに載せたい文章: ${a.step5?.heroText ?? '未定'}`,
    `自己紹介・事業紹介文: ${a.step5?.aboutText ?? '未定'}`,
  ]
  const brief = a.design?.brief
  if (brief) {
    lines.push('', briefToPromptText(brief))
    if (a.design?.directionName) lines.push(`選択したデザインの方向性: ${a.design.directionName}`)
  }
  return lines.join('\n')
}

export function materialsToAssets(answers: WizardAnswers): SiteAsset[] {
  return (answers.step5?.materials ?? []).map((m) => ({
    id: m.id,
    url: m.url,
    kind: m.kind,
    caption: m.caption,
  }))
}

function materialsPromptText(assets: SiteAsset[]): string {
  if (assets.length === 0) {
    return 'アップロード済みの写真素材: なし（画像はすべて placeholder とし、intent に入れるべき写真の内容を具体的な日本語で書く）'
  }
  const lines = assets.map(
    (a) => `- id: ${a.id} ［${materialKindLabel(a.kind)}］ ${a.caption || '写真'}`,
  )
  return `アップロード済みの写真素材（image の source:"material" + materialId で参照する）:
${lines.join('\n')}
素材の使い分け: 外観・店内はヒーローや店舗紹介に、商品は商品セクションに、人物は紹介文の横に優先的に使う。
足りない画像は source:"placeholder" で補い、intent に推奨する写真の内容を書く。`
}

// ─────────────────────────────── 呼び出し 1: Brief + Design Tokens

const DESIGN_SYSTEM_PROMPT = `あなたは老舗企業・個人事業者のWebサイトを手がけるアートディレクターです。
ヒアリング内容から、サイトの基本情報（brief）とデザイントークン（design）を決めてください。

方針:
- 業種とトーンに最も合う preset を選び、事業の個性に合わせて色を最小限だけ上書きする
- 「スタートアップのLP」のような画一的な雰囲気にしない。落ち着き・信頼感・その土地の空気を大切にする
- 色を上書きする場合はコントラストを保つ（背景と文字、primary と onPrimary）
- 装飾（headingAccent / imageTreatment / sectionDivider / motion）も事業の個性に合わせて選ぶ。
  例：老舗・和 → rule + frame、職人・手仕事 → underline + offset、士業・製造 → bar + line
- ヒアリングにない事実（受賞歴・創業年など）を brief に創作しない`

interface DesignOutput {
  brief?: unknown
  design?: unknown
}

// ─────────────────────────────── 呼び出し 2: ページ・セクション構成

function contentSystemPrompt(hasContactForm: boolean): string {
  const catalogText = COMPONENT_CATALOG.map(
    (d) => `- ${d.component}（${d.category}）: ${d.use}`,
  ).join('\n')

  return `あなたは老舗企業・個人事業者のWebサイトを設計する一流のWebディレクター兼コピーライターです。
用意されたコンポーネントライブラリから最適なものを選び、propsに入れる文章を書いて、サイト全体を組み立ててください。
コンポーネントは以下の${COMPONENT_CATALOG.length}種類だけです。これ以外の名前は絶対に使わないでください。

${catalogText}

## 構成のルール
- ページ数は希望構成に合わせて1〜5ページ。最初のページは必ず slug "home"
- 各ページは必ずヘッダー系で始まり、フッター系で終わる（全ページ同じヘッダー・フッターを使う）
- トップページ: ヘッダー → ヒーロー →（強み・ストーリー・商品・声などを5〜7個）→ CTA → フッター の流れ
- 同じカテゴリのセクションを連続させない。写真の多いセクションと文字のセクションを交互に置き、リズムを作る
- 下層ページは3〜5セクションで簡潔に
- 実店舗がある事業は AccessInfo を必ずどこかに入れる
- 問い合わせフォームは${hasContactForm ? '必要なので ContactForm をトップまたは問い合わせページに入れる' : '不要なので ContactForm は使わない'}

## 文章のルール
- すべて自然で上品な日本語。誇張表現（「最高」「No.1」等）や絵文字は使わない
- ヒアリング内容を最大限活かし、足りない部分は業種から自然に補完する
- ただし固有の事実（住所・電話番号・価格・創業年・受賞歴）は創作しない。ヒアリングになければその項目を省略するか、「（あとで入力）」と書く
- 見出しは短く情緒的に、本文は具体的に。同じ語尾を続けない

## 画像のルール
- 素材一覧にある写真は source:"material" + materialId で必ず活用する
- 無い画像は source:"placeholder" とし、intent には「何を撮った写真を入れるべきか」を発注書のように具体的な日本語で書く（例：「湯気の立つせいろと職人の手元」）
- 写真が1枚も無くても、placeholder を使って完成されたレイアウトを組む

## スタイル（style）のルール
各セクションには任意で style を指定でき、同じコンポーネントでも表情を変えられる。テンプレート感をなくすため積極的に使う：
- 背景のリズム: background を default / surface / tint で切り替え、同じ背景を3セクション以上続けない。primary はページに1回まで（強い主張の帯）
- 強弱: いちばん伝えたいセクション1〜2箇所だけ headingScale を lg/xl にし、spacing を loose にする。事務的な情報（FAQ・アクセス等）は tight でよい
- 揃え: 読み物系セクションは align: "left" にすると誌面らしくなる。中央揃えの連続を避ける
- ただし装飾のための装飾はしない。迷ったら style を付けず既定に任せる`
}

interface ContentOutput {
  pages?: unknown
}

// ─────────────────────────────── パイプライン

export interface GenerateProgress {
  stage: 'design' | 'content' | 'validate'
}

export async function generateSite(
  answers: WizardAnswers,
  onProgress?: (p: GenerateProgress) => void,
): Promise<{ site: SiteData; issues: ValidationIssue[] }> {
  const hearing = buildHearingContext(answers)
  const assets = materialsToAssets(answers)
  const fallbackName =
    answers.cards?.['business-name']?.value?.trim() || 'あなたのお店'

  // 1. Site Brief + Design Tokens
  onProgress?.({ stage: 'design' })
  let brief: SiteBrief
  let tokens: DesignTokens
  try {
    const design = await completeWithTool<DesignOutput>(
      `## ヒアリング内容\n${hearing}`,
      DESIGN_SYSTEM_PROMPT,
      {
        name: 'set_site_design',
        description: 'サイトの基本情報とデザイントークンを設定する',
        input_schema: buildSiteDesignToolSchema() as Anthropic.Tool['input_schema'],
      },
    )
    brief = sanitizeBrief(design?.brief, fallbackName)
    tokens = buildTokensFromDesign(design?.design)
  } catch (e) {
    console.error('site design generation failed:', e instanceof Error ? e.message : e)
    brief = sanitizeBrief(null, fallbackName)
    tokens = TOKEN_PRESETS['trust-blue']
  }

  // 2. ページ・セクション構成
  onProgress?.({ stage: 'content' })
  const contentUser = `## ヒアリング内容
${hearing}

## サイトの基本情報（確定済み）
サイト名: ${brief.siteName}
タグライン: ${brief.tagline}
トーン: ${brief.toneKeywords.join('、')}
伝えるべきメッセージ: ${brief.keyMessages.join(' / ')}

## ${materialsPromptText(assets)}`

  const content = await completeWithToolLarge<ContentOutput>(
    contentUser,
    contentSystemPrompt(Boolean(answers.step4?.hasContactForm)),
    {
      name: 'set_site_content',
      description: 'サイトの全ページとセクション構成を設定する',
      input_schema: buildSiteContentToolSchema() as Anthropic.Tool['input_schema'],
    },
  )

  // 3. validation（未知コンポーネント除去・fallback 補完・stable ID 付与）
  onProgress?.({ stage: 'validate' })
  return validateSiteContent(content, brief, tokens, assets)
}
