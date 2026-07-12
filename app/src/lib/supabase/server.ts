import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// publishable key + Cookie セッションのサーバー用クライアント。
// RLS が適用されるため、公開データの読み取りと認証状態の確認に使う。
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    throw new Error('Supabase の環境変数が設定されていません')
  }

  const cookieStore = await cookies()
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Component から呼ばれた場合は Cookie を書けない。
          // セッション更新は Route Handler 側で行われるため無視してよい
        }
      },
    },
  })
}
