'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WizardProgress } from '@/components/wizard/WizardProgress'
import { loadWizardState } from '@/lib/storage'
import { StepId } from '@/types/wizard'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([])

  const currentStep = ((): StepId => {
    const match = pathname.match(/step-(\d)/)
    if (!match) return 1
    return Number(match[1]) as StepId
  })()

  useEffect(() => {
    const state = loadWizardState()
    setCompletedSteps(state.completedSteps)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <WizardProgress currentStep={currentStep} completedSteps={completedSteps} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
