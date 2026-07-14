'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'
import { saveChatMessages, StoredChatMessage } from '@/lib/chatStorage'
import { setStoredSessionId } from '@/lib/sessionSync'
import { saveWizardState } from '@/lib/storage'
import { WizardState } from '@/types/wizard'

/** 引き継ぎリンクの受け側。サーバーの進捗をこの端末へ取り込んで続きへ遷移する */
export default function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        const res = await fetch(`/api/session?id=${id}`)
        const body = await res.json()
        if (!res.ok) {
          setError(body.error ?? '引き継ぎに失敗しました')
          return
        }
        const state = body.state as WizardState
        saveWizardState(state, { notify: false })
        saveChatMessages((body.chat ?? []) as StoredChatMessage[])
        setStoredSessionId(id)
        router.replace(state.lastPath ?? '/wizard/step-1')
      } catch {
        setError('通信に失敗しました。時間をおいて試してください')
      }
    })()
  }, [id, router])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {!error ? (
        <>
          <div className="text-3xl">📱</div>
          <p className="text-sm text-gray-600">前回の続きを読み込んでいます…</p>
        </>
      ) : (
        <>
          <div className="text-3xl">😢</div>
          <p className="text-sm font-medium text-gray-800">{error}</p>
          <Link href="/" className="text-sm text-green-700 underline">
            トップページへ戻る
          </Link>
        </>
      )}
    </main>
  )
}
