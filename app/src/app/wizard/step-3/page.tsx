'use client'

import { CardStepPage } from '@/components/wizard/CardStepPage'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { loadWizardState, saveWizardState, updateStepAnswers } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'

const TONES = ['温かみ・親しみやすい', '上品・高級感', 'こだわり・職人気質', 'シンプル・清潔感', 'ポップ・カジュアル']

export default function Step3Page() {
  const { answers } = useWizardState()
  const tone = answers.step3?.tone ?? ''

  function handleTone(next: string) {
    saveWizardState(updateStepAnswers(loadWizardState(), 'step3', { tone: next }))
  }

  return (
    <CardStepPage
      stepId={3}
      title="伝えたいメッセージの言語化"
      why="サイトを訪れた人が最初の数秒で「自分向けだ」と感じられるかどうかが勝負です。一番伝えたいことを一言で言えるようにしましょう。"
      prevHref="/wizard/step-2"
      nextHref="/wizard/step-4"
      bottomExtra={
        <ChipSelect
          label="サイトの雰囲気・トーンはどれに近いですか？"
          options={TONES.map((t) => ({ value: t, label: t }))}
          selected={tone ? [tone] : []}
          onToggle={handleTone}
        />
      }
    />
  )
}
