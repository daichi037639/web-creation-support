'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { StepId } from '@/types/wizard'

interface StepLayoutProps {
  stepId: StepId
  title: string
  why: string
  children: ReactNode
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  prevHref?: string
}

export function StepLayout({
  stepId,
  title,
  why,
  children,
  onNext,
  nextLabel = '次へ',
  nextDisabled = false,
  prevHref,
}: StepLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="self-start rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold tracking-widest text-accent-700">
          STEP {stepId}
        </p>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-sub">
          <span className="font-semibold text-ink">なぜこのステップが必要か：</span>
          {why}
        </p>
      </header>

      <div className="flex flex-col gap-5">{children}</div>

      <footer className="flex items-center justify-between pt-2">
        {prevHref ? (
          <Link href={prevHref}>
            <Button variant="ghost">← 戻る</Button>
          </Link>
        ) : (
          <div />
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled}>
            {nextLabel} →
          </Button>
        )}
      </footer>
    </div>
  )
}
