import { getAdminUser, unauthorizedResponse } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

interface UpdateBody {
  title?: string
  industry?: string
  style_tags?: string[]
  summary?: string
  status?: 'draft' | 'published'
}

// 許可フィールドだけを抽出する（url や analysis の書き換えはさせない）
function pickUpdates(body: UpdateBody): Record<string, unknown> {
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) {
    updates.title = body.title.trim()
  }
  if (typeof body.industry === 'string' && body.industry.trim()) {
    updates.industry = body.industry.trim()
  }
  if (Array.isArray(body.style_tags)) {
    updates.style_tags = body.style_tags.filter(
      (t): t is string => typeof t === 'string' && t.trim().length > 0,
    )
  }
  if (typeof body.summary === 'string') updates.summary = body.summary
  if (body.status === 'draft' || body.status === 'published') {
    updates.status = body.status
  }
  return updates
}

// 分析結果の編集（管理者のみ）
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedResponse()

  const { id } = await params
  const updates = pickUpdates((await req.json()) as UpdateBody)
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: '更新できる項目がありません' }, { status: 400 })
  }
  updates.updated_at = new Date().toISOString()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('design_references')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('design_references update failed:', error.code, error.message)
    return Response.json({ error: '更新に失敗しました' }, { status: 500 })
  }
  return Response.json({ reference: data })
}

// 参考サイトの削除（管理者のみ）
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('design_references').delete().eq('id', id)

  if (error) {
    console.error('design_references delete failed:', error.code, error.message)
    return Response.json({ error: '削除に失敗しました' }, { status: 500 })
  }
  return Response.json({ ok: true })
}
