'use client'

import { CardStepPage } from '@/components/wizard/CardStepPage'

export default function Step2Page() {
  return (
    <CardStepPage
      stepId={2}
      title="ターゲット顧客の整理"
      why="「誰に届けたいか」が明確なほど、メッセージが刺さります。全員に向けて書くと、誰にも届きません。"
      prevHref="/wizard/step-1"
      nextHref="/wizard/step-3"
      chatContext="ユーザーは今、ターゲット顧客を整理するステップにいます。誰に届けたいか、その人の悩みや願望をカード形式で言葉にしようとしています。答えに詰まった質問があれば、具体例を示しながら一緒に言語化を手伝ってください。"
    />
  )
}
