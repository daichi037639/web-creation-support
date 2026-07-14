'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { AnswerStatusPanel } from '@/components/wizard/AnswerStatusPanel'
import { SaveIndicator } from '@/components/wizard/SaveIndicator'
import { SessionSync } from '@/components/wizard/SessionSync'
import { WizardProgress } from '@/components/wizard/WizardProgress'
import { countAnsweredCards } from '@/lib/questions'
import { loadWizardState, saveWizardState } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'
import { StepId } from '@/types/wizard'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { answers, completedSteps } = useWizardState()

  const currentStep = ((): StepId => {
    const match = pathname.match(/step-(\d)/)
    if (!match) return 1
    return Number(match[1]) as StepId
  })()

  // 「続きから再開」の遷移先として、最後に見ていたページを覚えておく
  useEffect(() => {
    const state = loadWizardState()
    if (state.lastPath !== pathname) {
      saveWizardState({ ...state, lastPath: pathname, currentStep }, { notify: false })
    }
  }, [pathname, currentStep])

  const cardProgress = countAnsweredCards(answers.profile ?? {}, answers.cards ?? {})

  return (
    <div className="flex min-h-screen flex-col">
      <WizardProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        cardProgress={cardProgress}
      />
      <div className="flex items-center justify-between px-4 pt-2">
        <AnswerStatusPanel />
        <SaveIndicator />
      </div>
      <div className="flex-1">{children}</div>
      {/* チャットはウィザード全体で1つ。ステップ間を移動しても会話が途切れない */}
      <AiChatOverlay />
      <SessionSync />
    </div>
  )
}
