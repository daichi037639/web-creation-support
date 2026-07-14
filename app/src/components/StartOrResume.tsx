'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { clearChatMessages } from '@/lib/chatStorage'
import { countAnsweredCards } from '@/lib/questions'
import { clearWizardState } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'

/** トップページのCTA。進行中のデータがあれば「続きから再開」を優先して見せる */
export function StartOrResume() {
  const router = useRouter()
  const state = useWizardState()
  const { answers, completedSteps } = state

  const hasProgress =
    completedSteps.length > 0 ||
    Object.keys(answers.cards ?? {}).length > 0 ||
    !!answers.profile?.industry

  if (!hasProgress) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Link href="/wizard/step-1">
          <Button className="px-10 py-3 text-base">はじめる →</Button>
        </Link>
        <p className="text-xs text-gray-400">入力は自動で保存され、途中で離れても続きから再開できます</p>
      </div>
    )
  }

  const progress = countAnsweredCards(answers.profile ?? {}, answers.cards ?? {})
  const resumeHref = state.lastPath ?? '/wizard/step-1'

  function restart() {
    if (!window.confirm('入力した内容をすべて消して、最初からやり直しますか？')) return
    clearWizardState()
    clearChatMessages()
    router.push('/wizard/step-1')
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Link href={resumeHref}>
        <Button className="px-10 py-3 text-base">
          つづきから再開する →
        </Button>
      </Link>
      <p className="text-xs text-gray-500">
        カード {progress.answered} / {progress.total} 枚まで入力済み。前回の続きから進められます
      </p>
      <button onClick={restart} className="text-xs text-gray-400 underline hover:text-gray-600">
        最初からやり直す
      </button>
    </div>
  )
}
