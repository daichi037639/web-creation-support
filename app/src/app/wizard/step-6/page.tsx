'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { AiChatOverlay } from '@/components/wizard/AiChatOverlay'
import { Button } from '@/components/ui/Button'
import { loadWizardState, saveWizardState, updateStepAnswers, markStepComplete } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'

export default function Step6Page() {
  const router = useRouter()
  const { answers } = useWizardState()
  const [streamCode, setStreamCode] = useState('')
  const [streamType, setStreamType] = useState<'static' | 'nextjs' | null>(null)
  const [generating, setGenerating] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)

  const generatedCode = generating ? streamCode : (answers.step6?.generatedCode ?? '')
  const codeType = streamType ?? answers.step6?.codeType ?? 'static'
  const showPreview = !generating && generatedCode !== ''

  async function generate() {
    setGenerating(true)
    setStreamCode('')

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })

    const detectedType = (res.headers.get('X-Code-Type') ?? 'static') as 'static' | 'nextjs'
    setStreamType(detectedType)

    if (!res.body) { setGenerating(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let code = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      code += decoder.decode(value, { stream: true })
      setStreamCode(code)
    }

    let state = loadWizardState()
    state = updateStepAnswers(state, 'step6', { generatedCode: code, codeType: detectedType })
    state = markStepComplete(state, 6)
    saveWizardState(state)

    setGenerating(false)
  }

  function saveAndNext() {
    router.push('/wizard/step-7')
  }

  return (
    <>
      <StepLayout
        stepId={6}
        title="サイト生成"
        why="STEP 1〜5で整理した情報をもとに、AIがサイトのコードを自動生成します。生成後も自然言語で修正指示を出せます。"
        onNext={generatedCode ? saveAndNext : undefined}
        nextLabel="公開手順へ"
        prevHref="/wizard/design"
      >
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium mb-1">生成形式：<span className="text-green-700">{codeType === 'nextjs' ? 'Next.js' : '静的HTML'}</span></p>
          <p className="text-xs text-gray-500">
            {codeType === 'nextjs'
              ? 'お問い合わせフォームなどの動的機能が含まれるため、Next.jsで生成します'
              : 'シンプルなサイトのため、静的HTMLで生成します。管理がかんたんです'}
          </p>
        </div>

        <Button onClick={generate} disabled={generating} className="w-full py-3">
          {generating ? '生成中...' : generatedCode ? '再生成する' : 'サイトを生成する'}
        </Button>

        {generating && generatedCode && (
          <div className="rounded-xl bg-gray-900 p-4 max-h-48 overflow-y-auto">
            <pre className="text-xs text-green-400 whitespace-pre-wrap">{generatedCode}</pre>
          </div>
        )}

        {showPreview && generatedCode && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">プレビュー</p>
              <button
                onClick={() => {
                  const blob = new Blob([generatedCode], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  window.open(url, '_blank')
                }}
                className="text-xs text-green-700 underline"
              >
                別タブで開く
              </button>
            </div>
            <iframe
              ref={previewRef}
              srcDoc={generatedCode}
              className="h-96 w-full rounded-xl border border-gray-200"
              title="サイトプレビュー"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </StepLayout>
      <AiChatOverlay systemContext="ユーザーは今、AIにサイトを生成させるステップにいます。生成されたサイトへの修正要望や疑問に答えてください。" />
    </>
  )
}
