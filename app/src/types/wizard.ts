export type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const STEPS: { id: StepId; title: string; description: string }[] = [
  { id: 0, title: 'はじめに', description: 'このサービスでできることを確認する' },
  { id: 1, title: '事業・商品', description: '何を売っているか、強みは何か' },
  { id: 2, title: 'ターゲット', description: '誰に届けたいか、どんな悩みを解決するか' },
  { id: 3, title: 'メッセージ', description: '一番伝えたいことは何か' },
  { id: 4, title: 'サイト構成', description: 'どんなページが必要か、何を載せるか' },
  { id: 5, title: 'コンテンツ', description: '文章・写真の準備' },
  { id: 6, title: 'サイト生成', description: 'AIがサイトを生成する' },
  { id: 7, title: '公開', description: 'GitHub + Vercelでデプロイ' },
]

export type BusinessType = 'store' | 'online' | 'both' | 'visit'

export type Industry =
  | 'restaurant'
  | 'retail'
  | 'food-producer'
  | 'beauty'
  | 'lodging'
  | 'school'
  | 'professional'
  | 'manufacturing'
  | 'other'

export interface BusinessProfile {
  businessType?: BusinessType
  industry?: Industry
  industryOther?: string
}

export type CardStatus = 'unanswered' | 'answered' | 'deferred'

export interface CardAnswer {
  value: string
  status: CardStatus
}

export interface Step4Answers {
  pages?: string[]
  hasContactForm?: boolean
  hasReservation?: boolean
  hasEcommerce?: boolean
}

export interface WizardAnswers {
  profile?: BusinessProfile
  /** STEP 1〜3 の回答。キーは質問バンク（lib/questions.ts）の質問ID */
  cards?: Record<string, CardAnswer>
  step3?: {
    tone?: string
  }
  step4?: Step4Answers
  step5?: {
    heroText?: string
    aboutText?: string
    photosReady?: boolean
  }
  step6?: {
    codeType?: 'static' | 'nextjs'
    generatedCode?: string
  }
}

export interface WizardState {
  currentStep: StepId
  answers: WizardAnswers
  completedSteps: StepId[]
}
