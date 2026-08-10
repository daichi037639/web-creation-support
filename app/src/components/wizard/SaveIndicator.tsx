'use client'

import { useEffect, useRef, useState } from 'react'
import { WIZARD_STATE_EVENT } from '@/lib/storage'

/** 「一時保存できているか不安」を消すための表示。保存イベントのたびに短くフィードバックする */
export function SaveIndicator() {
  const [justSaved, setJustSaved] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const handler = () => {
      setJustSaved(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setJustSaved(false), 2000)
    }
    window.addEventListener(WIZARD_STATE_EVENT, handler)
    return () => {
      window.removeEventListener(WIZARD_STATE_EVENT, handler)
      window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <p
      className={`text-right text-[11px] transition-colors ${
        justSaved ? 'font-medium text-accent-700' : 'text-slate-400'
      }`}
    >
      {justSaved ? '✓ 保存しました' : '入力は自動で保存されます。途中でやめても続きから再開できます'}
    </p>
  )
}
