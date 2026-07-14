'use client'

import { CardAnswer } from '@/types/wizard'
import { ResolvedQuestion } from '@/lib/questions'
import { TextArea } from '@/components/ui/TextArea'

interface QuestionCardProps {
  question: ResolvedQuestion
  answer?: CardAnswer
  onChange: (answer: CardAnswer) => void
  onConsult: () => void
}

const STATUS_BADGE = {
  answered: { label: '✓ 入力済み', className: 'bg-green-100 text-green-700' },
  unanswered: { label: '未入力', className: 'bg-gray-100 text-gray-500' },
} as const

export function QuestionCard({ question, answer, onChange, onConsult }: QuestionCardProps) {
  const status = answer?.status ?? 'unanswered'
  const value = answer?.value ?? ''
  const badge = STATUS_BADGE[status]

  function handleInput(nextValue: string) {
    onChange({ value: nextValue, status: nextValue.trim() ? 'answered' : 'unanswered' })
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors ${
        status === 'answered' ? 'border-green-300' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
            {badge.label}
          </span>
          <p className="text-sm font-semibold text-gray-900">{question.title}</p>
        </div>
        {question.recommended && (
          <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
            おすすめ
          </span>
        )}
      </div>

      <TextArea
        label={question.label}
        placeholder={question.placeholder}
        hint={question.hint}
        value={value}
        rows={question.rows}
        onChange={(e) => handleInput(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={onConsult}
          className="text-xs font-medium text-green-700 hover:text-green-900"
        >
          💬 AIと一緒に考える
        </button>
      </div>
    </div>
  )
}
