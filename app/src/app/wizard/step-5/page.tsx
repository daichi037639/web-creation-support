'use client'

import { useRouter } from 'next/navigation'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'

export default function Step5Page() {
  const router = useRouter()
  const { answers } = useWizardState()
  const step5 = answers.step5 ?? {}

  function update(patch: { heroText?: string; aboutText?: string; photosReady?: boolean }) {
    saveWizardState(updateStepAnswers(loadWizardState(), 'step5', patch))
  }

  function save() {
    saveWizardState(markStepComplete(loadWizardState(), 5))
    router.push('/wizard/step-6')
  }

  const canProceed = (step5.heroText ?? '').trim() !== ''

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
          value={step5.heroText ?? ''}
          onChange={(e) => update({ heroText: e.target.value })}
          rows={4}
          hint="サイトを開いた瞬間に表示される一番目立つ文章です。下書きで大丈夫です"
        />
        <TextArea
          label="お店・事業者の自己紹介文（任意）"
          placeholder="例：昭和30年創業の喜多の園は、群馬県桐生市で三代にわたってお茶を育ててきた農家です..."
          value={step5.aboutText ?? ''}
          onChange={(e) => update({ aboutText: e.target.value })}
          rows={4}
          hint="あなたの人柄や歴史が伝わる文章です。後でAIが整えることもできます"
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={step5.photosReady ?? false}
            onChange={(e) => update({ photosReady: e.target.checked })}
            className="h-4 w-4 accent-green-700"
          />
          <span className="text-sm text-gray-700">
            写真素材がある（商品写真・店舗写真・人物写真など）
          </span>
        </label>
        {!step5.photosReady && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            写真がない場合でも大丈夫です。AIがサンプル画像を組み込んだサイトを生成します。後から差し替えられます。
          </p>
        )}
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、Webサイトに載せるコンテンツ（文章・写真）を準備するステップにいます。文章の書き方に迷っている可能性があります。" />
    </>
  )
}
