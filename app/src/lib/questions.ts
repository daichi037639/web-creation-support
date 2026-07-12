import {
  BusinessProfile,
  BusinessType,
  CardAnswer,
  Industry,
  WizardAnswers,
} from '@/types/wizard'

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'store', label: '実店舗' },
  { value: 'online', label: 'オンライン販売' },
  { value: 'both', label: '実店舗 + オンライン' },
  { value: 'visit', label: '訪問・出張型' },
]

export const INDUSTRY_OPTIONS: { value: Industry; label: string }[] = [
  { value: 'restaurant', label: '飲食店' },
  { value: 'retail', label: '小売・物販' },
  { value: 'food-producer', label: '食品・農産物の生産販売' },
  { value: 'beauty', label: '美容・サロン' },
  { value: 'lodging', label: '宿泊・観光' },
  { value: 'school', label: '教室・スクール' },
  { value: 'professional', label: '士業・専門サービス' },
  { value: 'manufacturing', label: '製造業' },
  { value: 'other', label: 'その他' },
]

interface QuestionVariant {
  title?: string
  label?: string
  placeholder?: string
  hint?: string
}

export interface QuestionDef {
  id: string
  step: 1 | 2 | 3
  /** カードの見出しになる短い名詞（例：商品の概要） */
  title: string
  label: string
  placeholder: string
  hint: string
  required?: boolean
  rows?: number
  /** 指定した業界のみに表示する。未指定なら全業界 */
  industries?: Industry[]
  /** 指定した業態のみに表示する。未指定なら全業態 */
  businessTypes?: BusinessType[]
  /** 業界ごとの文言の言い換え */
  variants?: Partial<Record<Industry, QuestionVariant>>
}

export const QUESTION_BANK: QuestionDef[] = [
  {
    id: 'business-name',
    step: 1,
    title: '事業・店舗の名前',
    label: '事業・店舗の名前を教えてください',
    placeholder: '例：喜多の園',
    hint: '屋号・ブランド名など、お客さんが呼ぶ名前で構いません',
    required: true,
    rows: 1,
  },
  {
    id: 'products',
    step: 1,
    title: '商品の概要',
    label: 'どんな商品・サービスを提供していますか？',
    placeholder: '例：創業70年の老舗茶農家として、群馬県産の緑茶・ほうじ茶を栽培・販売しています',
    hint: '商品の種類・提供方法など、思いついたまま書いてください',
    required: true,
    variants: {
      restaurant: {
        placeholder: '例：桐生名物のひもかわうどんを、自家製麺で提供しています',
      },
      beauty: {
        placeholder: '例：完全予約制のプライベートサロンで、カット・カラーを提供しています',
      },
      school: {
        placeholder: '例：子供向けのピアノ教室を、月謝制で開いています',
      },
    },
  },
  {
    id: 'strengths',
    step: 1,
    title: 'あなたのこだわり',
    label: '他と違う強み・こだわりは何ですか？',
    placeholder: '例：農薬を使わない有機栽培にこだわり、摘みたてを直送しています',
    hint: 'なぜお客さんはあなたを選ぶのか、を考えてみてください',
    variants: {
      restaurant: {
        placeholder: '例：毎朝手打ちする麺と、地元野菜だけを使った出汁にこだわっています',
      },
    },
  },
  {
    id: 'history',
    step: 1,
    title: 'あなたの会社の歴史',
    label: 'これまでの歴史・背景を教えてください',
    placeholder: '例：祖父が昭和30年に創業。三代にわたって桐生の自然の中でお茶を作り続けています',
    hint: 'ストーリーは信頼につながります。思い当たることがあれば書いてください',
  },
  {
    id: 'target-persona',
    step: 2,
    title: '届けたい相手',
    label: 'どんな人に届けたいですか？',
    placeholder: '例：30〜50代の健康意識が高い女性、贈り物を探している方',
    hint: '年代・性別・ライフスタイルなど、思い浮かぶ人物像を書いてください',
    rows: 2,
  },
  {
    id: 'target-problem',
    step: 2,
    title: 'お客さまの悩み',
    label: 'その人はどんな悩みや不満を持っていますか？',
    placeholder: '例：スーパーのお茶では満足できない、産地がわからないものを子供に飲ませたくない',
    hint: 'あなたの商品・サービスを必要とする理由になる悩みを考えてみてください',
    variants: {
      restaurant: {
        title: 'お店を選ぶ場面',
        label: 'お客さまはどんな気分・場面であなたのお店を選びますか？',
        placeholder: '例：家族でゆっくり食事したいとき、桐生観光の締めに名物を食べたいとき',
        hint: '「どんなときに思い出してほしいか」をイメージしてください',
      },
      lodging: {
        title: '選ばれる場面',
        label: 'お客さまはどんな旅・目的であなたの宿を選びますか？',
        placeholder: '例：温泉で疲れを癒したい夫婦旅、子連れでも気兼ねなく泊まりたい家族旅行',
        hint: '「どんな旅の相棒になりたいか」をイメージしてください',
      },
    },
  },
  {
    id: 'target-desire',
    step: 2,
    title: 'なってほしい姿',
    label: 'その人はどうなりたいと思っていますか？',
    placeholder: '例：安心して飲めるお茶を家族に届けたい、贈って喜ばれるギフトを選びたい',
    hint: '商品を手に入れた後の「なりたい状態」をイメージしてください',
  },
  {
    id: 'visit-trigger',
    step: 2,
    title: '来店のきっかけ',
    label: 'お客さまはどうやってあなたのお店を知り、来店しますか？',
    placeholder: '例：口コミ、通りがかり、Instagramを見て。週末は観光客も多いです',
    hint: 'サイトからお店への導線（地図・営業時間など）を決める材料になります',
    businessTypes: ['store', 'both'],
  },
  {
    id: 'purchase-trigger',
    step: 2,
    title: '購入の決め手',
    label: 'オンラインで買うお客さまの「決め手」は何だと思いますか？',
    placeholder: '例：産地直送の新鮮さ、ギフト包装があること、レビューの評判',
    hint: 'サイトで何を目立たせるべきかを決める材料になります',
    businessTypes: ['online', 'both'],
  },
  {
    id: 'main-message',
    step: 3,
    title: '伝えたいメッセージ',
    label: '一番伝えたいことを一文で書いてください',
    placeholder: '例：三代続く茶農家が、農薬を使わずに育てたお茶を、産地直送でお届けします',
    hint: 'うまく書けなくても大丈夫。「こんなことが言いたい」という気持ちを書いてください',
  },
]

export interface ResolvedQuestion {
  id: string
  step: 1 | 2 | 3
  title: string
  label: string
  placeholder: string
  hint: string
  required: boolean
  rows: number
}

function matchesProfile(q: QuestionDef, profile: BusinessProfile): boolean {
  if (q.industries && (!profile.industry || !q.industries.includes(profile.industry))) return false
  if (q.businessTypes && (!profile.businessType || !q.businessTypes.includes(profile.businessType)))
    return false
  return true
}

function resolveVariant(q: QuestionDef, profile: BusinessProfile): ResolvedQuestion {
  const v: QuestionVariant = (profile.industry && q.variants?.[profile.industry]) || {}
  return {
    id: q.id,
    step: q.step,
    title: v.title ?? q.title,
    label: v.label ?? q.label,
    placeholder: v.placeholder ?? q.placeholder,
    hint: v.hint ?? q.hint,
    required: q.required ?? false,
    rows: q.rows ?? 3,
  }
}

export function getQuestionsFor(step: 1 | 2 | 3, profile: BusinessProfile): ResolvedQuestion[] {
  return QUESTION_BANK.filter((q) => q.step === step && matchesProfile(q, profile)).map((q) =>
    resolveVariant(q, profile),
  )
}

export function getRequiredIds(step: 1 | 2 | 3, profile: BusinessProfile): string[] {
  return getQuestionsFor(step, profile)
    .filter((q) => q.required)
    .map((q) => q.id)
}

export function isStepClear(
  step: 1 | 2 | 3,
  profile: BusinessProfile,
  cards: Record<string, CardAnswer>,
): boolean {
  if (step === 1 && (!profile.businessType || !profile.industry)) return false
  return getRequiredIds(step, profile).every((id) => cards[id]?.status === 'answered')
}

export function countAnsweredCards(
  profile: BusinessProfile,
  cards: Record<string, CardAnswer>,
): { answered: number; total: number } {
  const all = ([1, 2, 3] as const).flatMap((s) => getQuestionsFor(s, profile))
  const answered = all.filter((q) => cards[q.id]?.status === 'answered').length
  return { answered, total: all.length }
}

export function industryLabel(profile: BusinessProfile): string {
  if (profile.industry === 'other' && profile.industryOther) return profile.industryOther
  return INDUSTRY_OPTIONS.find((o) => o.value === profile.industry)?.label ?? '未選択'
}

function businessTypeLabel(profile: BusinessProfile): string {
  return BUSINESS_TYPE_OPTIONS.find((o) => o.value === profile.businessType)?.label ?? '未選択'
}

/** STEP 1〜3 の回答をAI向けコンテキスト文字列にする。保留・未入力はAIが補完提案する前提で明示する */
export function buildPlanningContext(answers: WizardAnswers): string {
  const profile = answers.profile ?? {}
  const cards = answers.cards ?? {}
  const lines = [`業界: ${industryLabel(profile)}`, `業態: ${businessTypeLabel(profile)}`]
  for (const step of [1, 2, 3] as const) {
    for (const q of getQuestionsFor(step, profile)) {
      const card = cards[q.id]
      const value =
        card?.status === 'answered' && card.value.trim() !== ''
          ? card.value
          : '未定（AIが内容から補完・提案する）'
      lines.push(`${q.title}: ${value}`)
    }
  }
  lines.push(`トーン・雰囲気: ${answers.step3?.tone ?? '未定（AIが提案する）'}`)
  return lines.join('\n')
}
