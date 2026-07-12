import { createServerSupabase } from '@/lib/supabase/server'
import { parseAdminEmails, isAdminEmail } from '@/lib/adminEmails'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email?: string
    password?: string
  }
  if (!email || !password) {
    return Response.json(
      { error: 'メールアドレスとパスワードを入力してください' },
      { status: 400 },
    )
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error || !data.user) {
    return Response.json(
      { error: 'メールアドレスまたはパスワードが正しくありません' },
      { status: 401 },
    )
  }

  // ログイン自体が成功しても、管理者リストにいなければセッションを破棄する
  const allowlist = parseAdminEmails(process.env.ADMIN_EMAILS)
  if (!isAdminEmail(data.user.email, allowlist)) {
    await supabase.auth.signOut()
    return Response.json(
      { error: 'このアカウントには管理者権限がありません' },
      { status: 403 },
    )
  }

  return Response.json({ ok: true })
}
