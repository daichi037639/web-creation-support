import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'
import { parseAdminEmails, isAdminEmail } from '@/lib/adminEmails'

// Cookie のセッションを検証し、ADMIN_EMAILS に載っている管理者なら
// User を返す。未ログイン・管理者以外は null
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createServerSupabase()
  // getSession ではなく getUser を使う（サーバー側でトークンを検証するため）
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null

  const allowlist = parseAdminEmails(process.env.ADMIN_EMAILS)
  return isAdminEmail(data.user.email, allowlist) ? data.user : null
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: '管理者としてログインしてください' },
    { status: 401 },
  )
}
