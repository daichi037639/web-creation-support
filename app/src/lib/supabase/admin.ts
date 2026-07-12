import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// secret key を使う管理用クライアント。RLSをバイパスするため、
// 必ず requireAdmin() で認証した後にのみ使うこと。クライアントコードから
// import すると server-only がビルドエラーにする。
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('Supabase の環境変数が設定されていません')
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
