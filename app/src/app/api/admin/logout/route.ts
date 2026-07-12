import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  return Response.json({ ok: true })
}
