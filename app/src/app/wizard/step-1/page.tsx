'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'

export default function Step1Page() {
  const router = useRouter()
  const [answers, setAnswers] = useState({
    businessName: '',
    products: '',
    strengths: '',
    history: '',
  })

  useEffect(() => {
    const state = loadWizardState()
    if (state.answers.step1) setAnswers({ ...answers, ...state.answers.step1 })
  }, [])

  function save() {
    let state = loadWizardState()
    state = updateStepAnswers(state, 'step1', answers)
    state = markStepComplete(state, 1)
    saveWizardState(state)
    router.push('/wizard/step-2')
  }

  const canProceed = answers.businessName.trim() !== '' && answers.products.trim() !== ''

  return (
    <>
      <StepLayout
        stepId={1}
        title="事業・商品の棚卸し"
        why="あなたの事業の「何が」「なぜ」すばらしいのかを言葉にすることが、サイト全体の骨格になります。まずここを固めましょう。"
        onNext={save}
        nextDisabled={!canProceed}
        prevHref="/"
      >
        <TextArea
          label="事業・店舗の名前"
          placeholder="例：喜多の園"
          value={answers.businessName}
          onChange={(e) => setAnswers({ ...answers, businessName: e.target.value })}
          rows={1}
          hint="屋号・ブランド名など、お客さんが呼ぶ名前で構いません"
        />
        <TextArea
          label="どんな商品・サービスを提供していますか？"
          placeholder="例：創業70年の老舗茶農家として、群馬県産の緑茶・ほうじ茶を栽培・販売しています"
          value={answers.products}
          onChange={(e) => setAnswers({ ...answers, products: e.target.value })}
          hint="商品の種類・提供方法など、思いついたまま書いてください"
        />
        <TextArea
          label="他と違う強み・こだわりは何ですか？"
          placeholder="例：農薬を使わない有機栽培にこだわり、摘みたてを直送しています"
          value={answers.strengths}
          onChange={(e) => setAnswers({ ...answers, strengths: e.target.value })}
          hint="なぜお客さんはあなたから買うのか、を考えてみてください"
        />
        <TextArea
          label="歴史・背景（任意）"
          placeholder="例：祖父が昭和30年に創業。三代にわたって桐生の自然の中でお茶を作り続けています"
          value={answers.history}
          onChange={(e) => setAnswers({ ...answers, history: e.target.value })}
          hint="ストーリーは信頼につながります。思い当たることがあれば書いてください"
        />
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、事業・商品の棚卸しステップにいます。事業名・商品・強み・歴史を整理しようとしています。" />
    </>
  )
}
