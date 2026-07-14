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
    />
  )
}
