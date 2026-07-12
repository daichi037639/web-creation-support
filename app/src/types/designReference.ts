export interface DesignReferenceAnalysis {
  colorScheme: string
  layout: string
  typography: string
  tone: string
  targetAudience: string
  takeaways: string[]
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
