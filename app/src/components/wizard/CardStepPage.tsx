'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay, ConsultRequest } from '@/components/wizard/AiChatOverlay'
import { QuestionCard } from '@/components/wizard/QuestionCard'
import { StepClearOverlay } from '@/components/wizard/StepClearOverlay'
import { getQuestionsFor, isStepClear } from '@/lib/questions'
import {
  loadWizardState,
  saveWizardState,
  updateCards,
  updateStepAnswers,
  markStepComplete,
} from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'
import { BusinessProfile, CardAnswer } from '@/types/wizard'

interface ProfileControl {
  profile: BusinessProfile
  onProfileChange: (patch: Partial<BusinessProfile>) => void
}

interface CardStepPageProps {
  stepId: 1 | 2 | 3
  title: string
  why: string
  prevHref: string
  nextHref: string
  chatContext: string
  /** カードリストの上に置く追加UI。業態・業界（STEP 1）は質問の出し分けと連動するため render prop で渡す */
  topExtra?: (control: ProfileControl) => ReactNode
  bottomExtra?: ReactNode
}

export function CardStepPage({
  stepId,
  title,
  why,
  prevHref,
  nextHref,
  chatContext,
  topExtra,
  bottomExtra,
}: CardStepPageProps) {
  const router = useRouter()
  const { answers } = useWizardState()
  const [consult, setConsult] = useState<ConsultRequest | null>(null)
  const [cleared, setCleared] = useState(false)

  const profile = answers.profile ?? {}
  const cards = answers.cards ?? {}

  // 入力のたびに保存する：途中離脱しても入力が消えない
  function handleCardChange(id: string, answer: CardAnswer) {
    saveWizardState(updateCards(loadWizardState(), { [id]: answer }))
  }

  function handleProfileChange(patch: Partial<BusinessProfile>) {
    saveWizardState(updateStepAnswers(loadWizardState(), 'profile', patch))
  }

  function clearStep() {
    saveWizardState(markStepComplete(loadWizardState(), stepId))
    setCleared(true)
  }

  const questions = getQuestionsFor(stepId, profile)
  const active = questions.filter((q) => cards[q.id]?.status !== 'deferred')
  const deferred = questions.filter((q) => cards[q.id]?.status === 'deferred')
  const answeredCount = questions.filter((q) => cards[q.id]?.status === 'answered').length

  return (
    <>
      <StepLayout
        stepId={stepId}
        title={title}
        why={why}
        onNext={clearStep}
        nextDisabled={!isStepClear(stepId, profile, cards)}
        prevHref={prevHref}
      >
        {topExtra?.({ profile, onProfileChange: handleProfileChange })}

        <p className="text-xs font-medium text-gray-500">
          🃏 カード {answeredCount} / {questions.length} 枚
          <span className="ml-2 text-gray-400">
            答えられるものから埋めればOK。迷ったら「あとで考える」へ
          </span>
        </p>

        {active.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            answer={cards[q.id]}
            onChange={(answer) => handleCardChange(q.id, answer)}
            onConsult={() => setConsult({ id: Date.now(), topic: q.label })}
          />
        ))}

        {deferred.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400">あとで考えるカード</p>
            {deferred.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                answer={cards[q.id]}
                onChange={(answer) => handleCardChange(q.id, answer)}
                onConsult={() => setConsult({ id: Date.now(), topic: q.label })}
              />
            ))}
          </div>
        )}

        {bottomExtra}
      </StepLayout>

      {cleared && <StepClearOverlay stepId={stepId} onDone={() => router.push(nextHref)} />}
      <AiChatOverlay systemContext={chatContext} consultRequest={consult} />
    </>
  )
}
