'use client'

import { useRouter } from 'next/navigation'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'
import { Step4Answers } from '@/types/wizard'

const PAGE_OPTIONS = ['トップ（ホーム）', '商品・サービス紹介', '私たちについて（About）', 'お客さまの声', 'よくある質問', 'お問い合わせ', 'アクセス・店舗情報', 'ブログ・お知らせ']

interface FeatureOption {
  key: 'hasContactForm' | 'hasReservation' | 'hasEcommerce'
  label: string
  note: string
}

const FEATURE_OPTIONS: FeatureOption[] = [
  { key: 'hasContactForm', label: 'お問い合わせフォーム', note: 'メールを受け取れる入力フォーム' },
  { key: 'hasReservation', label: '予約・申し込みフォーム', note: '来店予約や体験申し込みなど' },
  { key: 'hasEcommerce', label: 'オンライン販売（EC）', note: 'カートで注文・決済できる機能' },
]

export default function Step4Page() {
  const router = useRouter()
  const { answers } = useWizardState()
  const step4 = answers.step4 ?? {}
  const pages = step4.pages ?? ['トップ（ホーム）']

  function update(patch: Step4Answers) {
    saveWizardState(updateStepAnswers(loadWizardState(), 'step4', patch))
  }

  function togglePage(p: string) {
    update({ pages: pages.includes(p) ? pages.filter((x) => x !== p) : [...pages, p] })
  }

  function save() {
    let state = loadWizardState()
    state = updateStepAnswers(state, 'step4', { pages, ...step4 })
    state = markStepComplete(state, 4)
    saveWizardState(state)
    router.push('/wizard/step-5')
  }

  const hasComplexFeature = !!(step4.hasContactForm || step4.hasReservation || step4.hasEcommerce)

  return (
    <>
      <StepLayout
        stepId={4}
        title="サイト構成の設計"
        why="サイトに必要なページと機能を決めます。これをもとにAIが生成するコードの種類（シンプルHTML or Next.js）が自動で決まります。"
        onNext={save}
        prevHref="/wizard/step-3"
      >
        <ChipSelect
          label="必要なページを選んでください（複数選択可）"
          options={PAGE_OPTIONS.map((p) => ({ value: p, label: p }))}
          selected={pages}
          onToggle={togglePage}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">必要な機能はありますか？</p>
          <div className="flex flex-col gap-2">
            {FEATURE_OPTIONS.map(({ key, label, note }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={step4[key] ?? false}
                  onChange={(e) => update({ [key]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-green-700"
                />
                <span>
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <span className="ml-2 text-xs text-gray-500">{note}</span>
                </span>
              </label>
            ))}
          </div>
          {hasComplexFeature && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              動的な機能を選択しました。生成コードは <strong>Next.js</strong> 形式になります。
            </p>
          )}
          {!hasComplexFeature && pages.length > 0 && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              シンプルなサイトです。生成コードは <strong>静的HTML</strong> 形式になります。
            </p>
          )}
        </div>
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、Webサイトのページ構成と必要な機能を決めるステップにいます。" />
    </>
  )
}
