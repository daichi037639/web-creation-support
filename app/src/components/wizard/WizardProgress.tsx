'use client'

import Link from 'next/link'
import { STEPS, StepId } from '@/types/wizard'
import { CheckIcon, LogoIcon } from '@/components/ui/icons'

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
    <nav className="w-full border-b border-line bg-surface px-4 py-3">
      <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-ink">
          <LogoIcon size={20} className="text-accent-500" />
          <span className="hidden text-xs font-semibold tracking-wide sm:block">
            Webサイト制作支援
          </span>
        </Link>
        {percent !== null && (
          <div className="flex max-w-md flex-1 items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-accent-700">
              完成度 {percent}%
            </span>
          </div>
        )}
      </div>
      <ol className="flex items-center justify-center gap-1 overflow-x-auto">
        {visibleSteps.map((step, i) => {
          const isDone = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          return (
            <li key={step.id} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                    ${isDone ? 'bg-accent-500 text-white' : isCurrent ? 'bg-accent-100 text-accent-700 ring-2 ring-accent-500' : 'border border-line bg-canvas text-muted'}`}
                >
                  {isDone ? <CheckIcon size={14} /> : step.id}
                </div>
                <span className={`hidden text-[10px] sm:block ${isCurrent ? 'font-medium text-accent-700' : 'text-muted'}`}>
                  {step.title}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div className={`h-px w-6 shrink-0 ${isDone ? 'bg-accent-400' : 'bg-line'}`} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
