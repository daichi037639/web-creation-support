'use client'

import Link from 'next/link'
import { getAllQuestions } from '@/lib/questions'
import { WizardAnswers } from '@/types/wizard'

interface PreGenerationCheckProps {
  answers: WizardAnswers
}

/** サイト生成の直前に「未入力のままAIにおまかせする項目」を確認してもらう（LOG-009） */
export function PreGenerationCheck({ answers }: PreGenerationCheckProps) {
  const profile = answers.profile ?? {}
  const cards = answers.cards ?? {}

  const unanswered = getAllQuestions(profile)
    .filter((q) => cards[q.id]?.status !== 'answered')
    .map((q) => ({ label: q.title, href: `/wizard/step-${q.step}` }))

  if (!answers.step3?.tone) {
    unanswered.push({ label: 'サイトの雰囲気・トーン', href: '/wizard/step-3' })
  }
  if (!answers.step5?.heroText?.trim()) {
    unanswered.push({ label: 'トップページのキャッチコピー', href: '/wizard/step-5' })
  }

  if (unanswered.length === 0) {
    return (
      <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
        ✓ すべての項目が入力済みです。あなたの言葉を最大限に活かしてサイトを生成します。
      </p>
    )
  }

  return (
    <div className="rounded-xl bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-800">
        次の {unanswered.length} 項目は未入力のため、AIが内容から想像して補います
      </p>
      <p className="mt-0.5 text-xs text-amber-700">
        このまま生成しても大丈夫です。埋めるほど、あなたらしいサイトになります。
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {unanswered.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="inline-block rounded-full bg-white px-2.5 py-1 text-xs text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
            >
              {item.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
