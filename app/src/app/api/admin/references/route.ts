import { getAdminUser, unauthorizedResponse } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeReferenceSite } from '@/lib/analyzeReference'
import { isSafePublicUrl } from '@/lib/referenceAnalysis'

export const runtime = 'nodejs'

// 参考サイトの登録（管理者のみ）：URL取得 → Claude分析 → Supabase保存
export async function POST(req: Request) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedResponse()

  const { url, status } = (await req.json()) as {
    url?: string
    status?: 'draft' | 'published'
  }
  if (!url || !isSafePublicUrl(url)) {
    return Response.json(
      { error: '有効な公開URL（http/https）を指定してください' },
      { status: 400 },
    )
  }

  let analysis
  try {
    analysis = await analyzeReferenceSite(url)
  } catch (e) {
    const message = e instanceof Error ? e.message : '分析に失敗しました'
    return Response.json({ error: message }, { status: 422 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('design_references')
    .upsert(
      {
        url,
        title: analysis.title,
        industry: analysis.industry,
        style_tags: analysis.styleTags,
        summary: analysis.summary,
        analysis: analysis.analysis,
        status: status ?? 'published',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'url' },
    )
    .select()
    .single()

  if (error) {
    // DBエラーの詳細はログのみに残し、レスポンスには出さない
    console.error('design_references upsert failed:', error.code, error.message)
    return Response.json({ error: '保存に失敗しました' }, { status: 500 })
  }
  return Response.json({ reference: data }, { status: 201 })
}

// 登録済み一覧（管理者のみ。draft含む全件）
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('design_references')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('design_references select failed:', error.code, error.message)
    return Response.json({ error: '取得に失敗しました' }, { status: 500 })
  }
  return Response.json({ references: data })
}
