'use client'

import { CardStepPage } from '@/components/wizard/CardStepPage'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { TextArea } from '@/components/ui/TextArea'
import { BUSINESS_TYPE_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/questions'
import { BusinessType, Industry } from '@/types/wizard'

export default function Step1Page() {
  return (
    <CardStepPage
      stepId={1}
      title="事業・商品の棚卸し"
      why="あなたの事業の「何が」「なぜ」すばらしいのかを言葉にすることが、サイト全体の骨格になります。まずここを固めましょう。"
      prevHref="/"
      nextHref="/wizard/step-2"
      topExtra={({ profile, onProfileChange }) => (
        <section className="flex flex-col gap-4 rounded-xl bg-green-50/70 p-4 ring-1 ring-green-100">
          <p className="text-sm font-semibold text-green-800">
            まずはタップで2つ選ぶだけ。あなたに合った質問カードをお配りします
          </p>
          <ChipSelect
            label="事業の形態は？"
            options={BUSINESS_TYPE_OPTIONS}
            selected={profile.businessType ? [profile.businessType] : []}
            onToggle={(v) => onProfileChange({ businessType: v as BusinessType })}
          />
          <ChipSelect
            label="業界は？"
            options={INDUSTRY_OPTIONS}
            selected={profile.industry ? [profile.industry] : []}
            onToggle={(v) => onProfileChange({ industry: v as Industry })}
          />
          {profile.industry === 'other' && (
            <TextArea
              label="どんな業界ですか？"
              placeholder="例：造園業"
              rows={1}
              value={profile.industryOther ?? ''}
              onChange={(e) => onProfileChange({ industryOther: e.target.value })}
            />
          )}
        </section>
      )}
    />
  )
}
