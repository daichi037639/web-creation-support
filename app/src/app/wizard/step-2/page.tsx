'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'

export default function Step2Page() {
  const router = useRouter()
  const [answers, setAnswers] = useState({
    targetAge: '',
    targetProblem: '',
    targetDesire: '',
  })

  useEffect(() => {
    const state = loadWizardState()
    if (state.answers.step2) setAnswers({ ...answers, ...state.answers.step2 })
  }, [])

  function save() {
    let state = loadWizardState()
    state = updateStepAnswers(state, 'step2', answers)
    state = markStepComplete(state, 2)
    saveWizardState(state)
    router.push('/wizard/step-3')
  }

  const canProceed = answers.targetProblem.trim() !== ''

  return (
    <>
      <StepLayout
        stepId={2}
        title="ターゲット顧客の整理"
        why="「誰に届けたいか」が明確なほど、メッセージが刺さります。全員に向けて書くと、誰にも届きません。"
        onNext={save}
        nextDisabled={!canProceed}
        prevHref="/wizard/step-1"
      >
        <TextArea
          label="どんな人に届けたいですか？"
          placeholder="例：30〜50代の健康意識が高い女性、贈り物を探している方、地元のお茶にこだわりたい方"
          value={answers.targetAge}
          onChange={(e) => setAnswers({ ...answers, targetAge: e.target.value })}
          rows={2}
          hint="年代・性別・ライフスタイルなど、思い浮かぶ人物像を書いてください"
        />
        <TextArea
          label="その人はどんな悩みや不満を持っていますか？"
          placeholder="例：スーパーのお茶では満足できない、添加物が心配、産地がわからないものを子供に飲ませたくない"
          value={answers.targetProblem}
          onChange={(e) => setAnswers({ ...answers, targetProblem: e.target.value })}
          hint="あなたの商品・サービスを必要とする理由になる悩みを考えてみてください"
        />
        <TextArea
          label="その人はどうなりたいと思っていますか？"
          placeholder="例：安心して飲めるお茶を家族に届けたい、本物の味を知りたい、贈って喜ばれるギフトを選びたい"
          value={answers.targetDesire}
          onChange={(e) => setAnswers({ ...answers, targetDesire: e.target.value })}
          hint="商品を手に入れた後の「なりたい状態」をイメージしてください"
        />
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、ターゲット顧客を整理するステップにいます。誰に届けたいか、その人の悩みや願望を言葉にしようとしています。" />
    </>
  )
}
