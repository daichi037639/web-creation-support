'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'

export default function Step5Page() {
  const router = useRouter()
  const [answers, setAnswers] = useState({ heroText: '', aboutText: '', photosReady: false })

  useEffect(() => {
    const state = loadWizardState()
    if (state.answers.step5) setAnswers({ ...answers, ...state.answers.step5 })
  }, [])

  function save() {
    let state = loadWizardState()
    state = updateStepAnswers(state, 'step5', answers)
    state = markStepComplete(state, 5)
    saveWizardState(state)
    router.push('/wizard/step-6')
  }

  const canProceed = answers.heroText.trim() !== ''

  return (
    <>
      <StepLayout
        stepId={5}
        title="コンテンツの準備"
        why="サイトの「顔」となる文章をここで準備します。後でAIが整えてくれるので、まずは下書きレベルで大丈夫です。"
        onNext={save}
        nextDisabled={!canProceed}
        prevHref="/wizard/step-4"
      >
        <TextArea
          label="トップページのキャッチコピー・説明文"
          placeholder="例：群馬の山里から、あなたの食卓へ。三代続く茶農家が育てた、農薬不使用のお茶をお届けします。"
          value={answers.heroText}
          onChange={(e) => setAnswers({ ...answers, heroText: e.target.value })}
          rows={4}
          hint="サイトを開いた瞬間に表示される一番目立つ文章です。下書きで大丈夫です"
        />
        <TextArea
          label="お店・事業者の自己紹介文（任意）"
          placeholder="例：昭和30年創業の喜多の園は、群馬県桐生市で三代にわたってお茶を育ててきた農家です..."
          value={answers.aboutText}
          onChange={(e) => setAnswers({ ...answers, aboutText: e.target.value })}
          rows={4}
          hint="あなたの人柄や歴史が伝わる文章です。後でAIが整えることもできます"
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={answers.photosReady}
            onChange={(e) => setAnswers({ ...answers, photosReady: e.target.checked })}
            className="h-4 w-4 accent-green-700"
          />
          <span className="text-sm text-gray-700">
            写真素材がある（商品写真・店舗写真・人物写真など）
          </span>
        </label>
        {!answers.photosReady && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            写真がない場合でも大丈夫です。AIがサンプル画像を組み込んだサイトを生成します。後から差し替えられます。
          </p>
        )}
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、Webサイトに載せるコンテンツ（文章・写真）を準備するステップにいます。文章の書き方に迷っている可能性があります。" />
    </>
  )
}
