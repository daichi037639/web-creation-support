'use client'

import { loadChatMessages } from '@/lib/chatStorage'
import { loadWizardState } from '@/lib/storage'

const SESSION_ID_KEY = 'wizard_session_id'

export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_ID_KEY)
}

export function setStoredSessionId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_ID_KEY, id)
}

// 同じ内容を何度も送らないための直前ペイロードのキャッシュ
let lastPushed = ''

/**
 * 現在の進捗（ウィザード状態 + チャット履歴）をサーバーへ保存する。
 * 成功時はセッションIDを返し、以後同じセッションへ上書き保存する。
 * force でない場合、実質的な入力が始まるまで・内容に変化がないうちは送らない
 */
export async function pushSession(force = false): Promise<string | null> {
  const state = loadWizardState()
  const chat = loadChatMessages()

  const hasProgress =
    Object.keys(state.answers.cards ?? {}).length > 0 ||
    !!state.answers.profile?.industry ||
    state.completedSteps.length > 0 ||
    chat.length > 0
  if (!force && !hasProgress) return null

  const body = JSON.stringify({ sessionId: getStoredSessionId() ?? undefined, state, chat })
  if (!force && body === lastPushed) return getStoredSessionId()

  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) throw new Error((await res.json()).error ?? '同期に失敗しました')

  lastPushed = body
  const { sessionId } = (await res.json()) as { sessionId: string }
  setStoredSessionId(sessionId)
  return sessionId
}
