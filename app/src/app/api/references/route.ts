import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// デザイン候補の検索（一般ユーザー向け）。
// publishable key のクライアントを使うため、RLSにより
// status = 'published' の行しか返らない
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const industry = searchParams.get('industry')
  const tag = searchParams.get('tag')

  const supabase = await createServerSupabase()
  let query = supabase
    .from('design_references')
    .select('id, url, title, industry, style_tags, summary, analysis, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (industry) query = query.eq('industry', industry)
  if (tag) query = query.contains('style_tags', [tag])

  const { data, error } = await query
  if (error) {
    console.error('references search failed:', error.code, error.message)
    return Response.json({ error: '検索に失敗しました' }, { status: 500 })
  }
  return Response.json({ references: data })
}
