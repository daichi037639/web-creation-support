export type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const STEPS: { id: StepId; title: string; description: string }[] = [
  { id: 0, title: 'はじめに', description: 'このサービスでできることを確認する' },
  { id: 1, title: '事業・商品', description: '何を売っているか、強みは何か' },
  { id: 2, title: 'ターゲット', description: '誰に届けたいか、どんな悩みを解決するか' },
  { id: 3, title: 'メッセージ', description: '一番伝えたいことは何か' },
  { id: 4, title: 'サイト構成', description: 'どんなページが必要か、何を載せるか' },
  { id: 5, title: 'コンテンツ', description: '文章・写真の準備' },
  { id: 6, title: 'サイト生成', description: '好みのデザインを選び、AIがサイトを生成する' },
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

export type CardStatus = 'unanswered' | 'answered'

export interface CardAnswer {
  value: string
  status: CardStatus
}

export type MaterialKind = 'product' | 'exterior' | 'interior' | 'people' | 'logo' | 'other'

/** アップロード済みの実素材写真。実体は Supabase Storage にあり、state にはURLとメタ情報のみ持つ */
export interface MaterialImage {
  /** uuid。Storage のオブジェクト名（{sessionId}/{id}.jpg）を兼ねる */
  id: string
  /** Supabase Storage の公開URL。生成サイトの <img src> にそのまま使う */
  url: string
  kind: MaterialKind
  /** AIが自動生成し、ユーザーが編集できる短い説明 */
  caption: string
}

export interface Step4Answers {
  pages?: string[]
  hasContactForm?: boolean
  hasReservation?: boolean
  hasEcommerce?: boolean
}

/** 参考デザインから作るデザイン設計書（サイト生成プロンプトに渡す） */
export interface DesignBrief {
  concept: string
  impression: string
  colorPalette: string[]
  typography: string
  firstView: string
  layoutSpacing: string
  photoTextRatio: string
  sections: string
  cta: string
  mobile: string
  avoid: string[]
}

/** 「デザインの好み」ステップの選択結果 */
export interface DesignChoice {
  /** candidate=候補を選択 / ai=AIにおまかせ / skip=候補なしで進む */
  choice: 'candidate' | 'ai' | 'skip'
  /** 参考にした design_references の ID（skip時はなし） */
  referenceId?: string
  /** 初心者向けのデザイン方向性の名称（例：伝統と上品さを重視） */
  directionName?: string
  brief?: DesignBrief
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
    /** @deprecated materials の有無で代替。旧データ互換のため残す */
    photosReady?: boolean
    materials?: MaterialImage[]
  }
  design?: DesignChoice
  step6?: {
    /** @deprecated 旧: 一括コード生成の結果。site へ移行 */
    codeType?: 'static' | 'nextjs'
    /** @deprecated 旧: 一括コード生成の結果。site へ移行 */
    generatedCode?: string
    /** Component-driven 生成の canonical state */
    site?: import('./site').SiteData
  }
}

export interface WizardState {
  currentStep: StepId
  answers: WizardAnswers
  completedSteps: StepId[]
  /** 最後に表示していたウィザードのパス。「続きから再開」の遷移先 */
  lastPath?: string
}
