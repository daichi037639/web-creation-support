import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { WizardState } from '@/types/wizard'

// wizard_sessions はポリシーなしRLSのため secret key 経由でのみ触れる。
// このモジュールは id（推測不可能なuuid）で特定した1行しか読み書きしないこと。
function createSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) throw new Error('Supabase の環境変数が設定されていません')
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface SessionPayload {
  state: WizardState
  chat: unknown[]
}

export async function upsertSession(
  sessionId: string | null,
  payload: SessionPayload,
): Promise<string> {
  const supabase = createSessionClient()
  const row = { state: payload.state, chat: payload.chat, updated_at: new Date().toISOString() }

  if (sessionId) {
    const { data, error } = await supabase
      .from('wizard_sessions')
      .update(row)
      .eq('id', sessionId)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (data) return data.id
    // 行が消えていた（手動削除など）場合は新規作成にフォールバック
  }

  const { data, error } = await supabase
    .from('wizard_sessions')
    .insert(row)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function getSession(sessionId: string): Promise<SessionPayload | null> {
  const supabase = createSessionClient()
  const { data, error } = await supabase
    .from('wizard_sessions')
    .select('state, chat')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) throw error
  return data ? { state: data.state as WizardState, chat: (data.chat as unknown[]) ?? [] } : null
}
