'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'

const TONES = ['温かみ・親しみやすい', '上品・高級感', 'こだわり・職人気質', 'シンプル・清潔感', 'ポップ・カジュアル']

export default function Step3Page() {
  const router = useRouter()
  const [answers, setAnswers] = useState({ mainMessage: '', tone: '' })

  useEffect(() => {
    const state = loadWizardState()
    if (state.answers.step3) setAnswers({ ...answers, ...state.answers.step3 })
  }, [])

  function save() {
    let state = loadWizardState()
    state = updateStepAnswers(state, 'step3', answers)
    state = markStepComplete(state, 3)
    saveWizardState(state)
    router.push('/wizard/step-4')
  }

  const canProceed = answers.mainMessage.trim() !== ''

  return (
    <>
      <StepLayout
        stepId={3}
        title="伝えたいメッセージの言語化"
        why="サイトを訪れた人が最初の数秒で「自分向けだ」と感じられるかどうかが勝負です。一番伝えたいことを一言で言えるようにしましょう。"
        onNext={save}
        nextDisabled={!canProceed}
        prevHref="/wizard/step-2"
      >
        <TextArea
          label="一番伝えたいことを一文で書いてください"
          placeholder="例：三代続く茶農家が、農薬を使わずに育てたお茶を、産地直送でお届けします"
          value={answers.mainMessage}
          onChange={(e) => setAnswers({ ...answers, mainMessage: e.target.value })}
          hint="うまく書けなくても大丈夫。「こんなことが言いたい」という気持ちを書いてください"
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">サイトの雰囲気・トーンはどれに近いですか？</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => setAnswers({ ...answers, tone })}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${answers.tone === tone ? 'border-green-600 bg-green-50 text-green-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、サイトで一番伝えたいメッセージとトーンを決めるステップにいます。" />
    </>
  )
}
