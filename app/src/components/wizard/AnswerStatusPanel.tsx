'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getQuestionsFor } from '@/lib/questions'
import { pushSession } from '@/lib/sessionSync'
import { useWizardState } from '@/lib/useWizardState'
import { STEPS } from '@/types/wizard'

/**
 * 全ステップ横断の回答状況一覧。未入力カードへワンタップで戻れるようにして、
 * 「順番どおりでなくても、入れられるところから埋める」使い方を支える（LOG-009）
 */
export function AnswerStatusPanel() {
  const [open, setOpen] = useState(false)
  const [handover, setHandover] = useState<{ url?: string; error?: string; busy?: boolean }>({})
  const { answers } = useWizardState()
  const profile = answers.profile ?? {}
  const cards = answers.cards ?? {}

  async function createHandoverLink() {
    setHandover({ busy: true })
    try {
      const sessionId = await pushSession(true)
      setHandover({ url: `${window.location.origin}/resume/${sessionId}` })
    } catch (e) {
      setHandover({ error: e instanceof Error ? e.message : '引き継ぎに失敗しました' })
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-green-700 hover:text-green-900"
      >
        📋 入力状況を見る
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">入力状況</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="mb-3 text-xs text-gray-500">
                未入力の項目はAIが補完しますが、埋めるほどサイトの仕上がりが良くなります。
                タップするとそのステップに移動できます。
              </p>
              {([1, 2, 3] as const).map((step) => {
                const questions = getQuestionsFor(step, profile)
                const stepInfo = STEPS.find((s) => s.id === step)
                return (
                  <div key={step} className="mb-4">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-green-700">
                      STEP {step}｜{stepInfo?.title}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {questions.map((q) => {
                        const done = cards[q.id]?.status === 'answered'
                        return (
                          <li key={q.id}>
                            <Link
                              href={`/wizard/step-${step}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50"
                            >
                              <span className={`text-sm ${done ? 'text-gray-700' : 'text-gray-500'}`}>
                                {q.title}
                              </span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {done ? '✓ 入力済み' : '未入力'}
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="border-t px-4 py-3">
              {!handover.url && (
                <button
                  onClick={createHandoverLink}
                  disabled={handover.busy}
                  className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50"
                >
                  {handover.busy ? '引き継ぎリンクを作成中…' : '📱 別の端末に引き継ぐ'}
                </button>
              )}
              {handover.url && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-gray-700">
                    このリンクを別の端末で開くと、続きから始められます
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={handover.url}
                      className="min-w-0 flex-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] text-gray-600 ring-1 ring-gray-200"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(handover.url!)}
                      className="shrink-0 rounded-lg bg-green-700 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-green-800"
                    >
                      コピー
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    ※ リンクを知っている人は誰でも開けます。他人に教えないでください
                  </p>
                </div>
              )}
              {handover.error && (
                <p className="mt-1 text-[11px] text-amber-700">{handover.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
