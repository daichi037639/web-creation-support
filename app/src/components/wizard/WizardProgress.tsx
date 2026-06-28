'use client'

import { STEPS, StepId } from '@/types/wizard'

interface WizardProgressProps {
  currentStep: StepId
  completedSteps: StepId[]
}

export function WizardProgress({ currentStep, completedSteps }: WizardProgressProps) {
  const visibleSteps = STEPS.filter((s) => s.id > 0)

  return (
    <nav className="w-full border-b border-gray-100 bg-white px-4 py-3">
      <ol className="flex items-center justify-center gap-1 overflow-x-auto">
        {visibleSteps.map((step, i) => {
          const isDone = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          return (
            <li key={step.id} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                    ${isDone ? 'bg-green-700 text-white' : isCurrent ? 'bg-green-100 text-green-700 ring-2 ring-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {isDone ? '✓' : step.id}
                </div>
                <span className={`hidden text-[10px] sm:block ${isCurrent ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div className={`h-px w-6 shrink-0 ${isDone ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
