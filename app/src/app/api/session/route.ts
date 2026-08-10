import { getSession, upsertSession } from '@/lib/supabase/sessions'
import { UUID_RE } from '@/lib/uuid'
import { WizardState } from '@/types/wizard'

export const runtime = 'nodejs'
/** state + chat 合計の上限（生成コードやチャット履歴を含むため余裕を持たせる） */
const MAX_PAYLOAD_CHARS = 2_000_000

const SETUP_ERROR =
  '同期機能がまだ有効になっていません（管理者向け：supabase/migrations/20260714_wizard_sessions.sql を実行してください）'

/** 進捗をサーバーへ保存し、セッションIDを返す（端末をまたいだ再開用） */
export async function POST(req: Request) {
  const { sessionId, state, chat } = (await req.json()) as {
    sessionId?: string
    state: WizardState
    chat?: unknown[]
  }

  if (!state || typeof state !== 'object') {
    return Response.json({ error: 'state がありません' }, { status: 400 })
  }
  if (sessionId && !UUID_RE.test(sessionId)) {
    return Response.json({ error: 'セッションIDが不正です' }, { status: 400 })
  }
  const payload = { state, chat: Array.isArray(chat) ? chat : [] }
  if (JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) {
    return Response.json({ error: '保存データが大きすぎます' }, { status: 400 })
  }

  try {
    const id = await upsertSession(sessionId ?? null, payload)
    return Response.json({ sessionId: id })
  } catch {
    return Response.json({ error: SETUP_ERROR }, { status: 503 })
  }
}

/** セッションIDから進捗を取り出す（引き継ぎ先の端末で使う） */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id || !UUID_RE.test(id)) {
    return Response.json({ error: 'セッションIDが不正です' }, { status: 400 })
  }

  try {
    const session = await getSession(id)
    if (!session) {
      return Response.json({ error: '引き継ぎデータが見つかりませんでした' }, { status: 404 })
    }
    return Response.json(session)
  } catch {
    return Response.json({ error: SETUP_ERROR }, { status: 503 })
  }
}
