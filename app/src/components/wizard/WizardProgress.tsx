'use client'

import { STEPS, StepId } from '@/types/wizard'

interface WizardProgressProps {
  currentStep: StepId
  completedSteps: StepId[]
  /** 回答済みカード数ベースの完成度（0〜100）。未指定なら非表示 */
  cardProgress?: { answered: number; total: number }
}

export function WizardProgress({ currentStep, completedSteps, cardProgress }: WizardProgressProps) {
  const visibleSteps = STEPS.filter((s) => s.id > 0)
  const percent = cardProgress && cardProgress.total > 0
    ? Math.round((cardProgress.answered / cardProgress.total) * 100)
    : null

  return (
    <nav className="w-full border-b border-gray-100 bg-white px-4 py-3">
      {percent !== null && (
        <div className="mx-auto mb-2 flex max-w-md items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-green-700">
            完成度 {percent}%
          </span>
        </div>
      )}
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
