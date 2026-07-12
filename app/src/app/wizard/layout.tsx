'use client'

import { usePathname } from 'next/navigation'
import { WizardProgress } from '@/components/wizard/WizardProgress'
import { countAnsweredCards } from '@/lib/questions'
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

  const cardProgress = countAnsweredCards(answers.profile ?? {}, answers.cards ?? {})

  return (
    <div className="flex min-h-screen flex-col">
      <WizardProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        cardProgress={cardProgress}
      />
      <div className="flex-1">{children}</div>
    </div>
  )
}
