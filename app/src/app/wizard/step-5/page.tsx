'use client'

import { useRouter } from 'next/navigation'
import { StepLayout } from '@/components/wizard/StepLayout'
import { MaterialUploader } from '@/components/wizard/MaterialUploader'
import { TextArea } from '@/components/ui/TextArea'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'
import type { MaterialImage } from '@/types/wizard'

export default function Step5Page() {
  const router = useRouter()
  const { answers } = useWizardState()
  const step5 = answers.step5 ?? {}

  function update(patch: { heroText?: string; aboutText?: string; materials?: MaterialImage[] }) {
    saveWizardState(updateStepAnswers(loadWizardState(), 'step5', patch))
  }

  function save() {
    saveWizardState(markStepComplete(loadWizardState(), 5))
    router.push('/wizard/design')
  }

  return (
    <>
      <StepLayout
        stepId={5}
        title="コンテンツの準備"
        why="サイトの「顔」となる文章をここで準備します。後でAIが整えてくれるので、まずは下書きレベルで大丈夫です。未入力でもAIが草案を作れます。"
        onNext={save}
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
        <MaterialUploader
          materials={step5.materials ?? []}
          onChange={(materials) => update({ materials })}
        />
        {(step5.materials ?? []).length === 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            写真がない場合でも大丈夫です。写真なしで美しく見えるサイトを生成し、後から追加できます。
          </p>
        )}
      </StepLayout>
    </>
  )
}
