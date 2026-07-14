'use client'

import { useEffect, useRef } from 'react'
import { WIZARD_CHAT_EVENT } from '@/lib/chatStorage'
import { pushSession } from '@/lib/sessionSync'
import { WIZARD_STATE_EVENT } from '@/lib/storage'

const DEBOUNCE_MS = 3000

/**
 * 入力・チャットの変化を数秒まとめてサーバーへ同期する（端末をまたいだ再開用）。
 * 同期に失敗してもローカルの自動保存（localStorage）は生きているため、UIには出さない
 */
export function SessionSync() {
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const schedule = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        pushSession().catch(() => {})
      }, DEBOUNCE_MS)
    }
    window.addEventListener(WIZARD_STATE_EVENT, schedule)
    window.addEventListener(WIZARD_CHAT_EVENT, schedule)
    return () => {
      window.removeEventListener(WIZARD_STATE_EVENT, schedule)
      window.removeEventListener(WIZARD_CHAT_EVENT, schedule)
      window.clearTimeout(timer.current)
    }
  }, [])

  return null
}
