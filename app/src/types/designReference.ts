export interface DesignReferenceAnalysis {
  colorScheme: string
  layout: string
  typography: string
  tone: string
  targetAudience: string
  takeaways: string[]
  // Storage上のスクリーンショット公開URL。テーブルの列を増やさず
  // analysis(jsonb) に持たせる（取得失敗時は undefined）
  screenshotUrl?: string
}

export interface DesignReference {
  id: string
  url: string
  title: string
  industry: string
  style_tags: string[]
  summary: string
  analysis: DesignReferenceAnalysis
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}
