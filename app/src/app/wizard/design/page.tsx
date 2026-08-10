'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { StepLayout } from '@/components/wizard/StepLayout'
import { Button } from '@/components/ui/Button'
import { loadWizardState, saveWizardState, updateStepAnswers } from '@/lib/storage'
import { useWizardState } from '@/lib/useWizardState'
import type { DesignBrief, DesignChoice } from '@/types/wizard'
import { DesignCandidateCard } from './DesignCandidateCard'

interface Candidate {
  referenceId: string
  name: string
  description: string
  features: string[]
  screenshotUrl?: string
}

type Selection = { type: 'candidate'; candidate: Candidate } | { type: 'ai' } | null

export default function DesignPage() {
  const router = useRouter()
  const { answers } = useWizardState()
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [selection, setSelection] = useState<Selection>(null)
  const [searching, setSearching] = useState(false)
  const [proceeding, setProceeding] = useState(false)
  const [notice, setNotice] = useState('')

  async function searchCandidates() {
    setSearching(true)
    setNotice('')
    try {
      const res = await fetch('/api/design-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const body = await res.json()
      if (res.ok && !body.fallback && body.candidates.length > 0) {
        setCandidates(body.candidates)
      } else {
        setCandidates([])
        setNotice('参考デザインが見つかりませんでした。このまま進むと、回答内容からAIが最適なデザインを考えます。')
      }
    } catch {
      setCandidates([])
      setNotice('候補の取得に失敗しました。このまま進んでもサイト生成には影響ありません。')
    }
    setSearching(false)
  }

  function saveChoice(design: DesignChoice) {
    saveWizardState(updateStepAnswers(loadWizardState(), 'design', design))
  }

  async function proceed() {
    // 候補なし・未選択の場合は従来どおりの標準デザイン生成で進む
    if (!candidates || candidates.length === 0 || selection === null) {
      saveChoice({ choice: 'skip' })
      router.push('/wizard/step-6')
      return
    }

    setProceeding(true)
    // 「AIにおまかせ」はスコア最上位（配列の先頭）をベースにする
    const base = selection.type === 'candidate' ? selection.candidate : candidates[0]
    let brief: DesignBrief | null = null
    try {
      const res = await fetch('/api/design-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          referenceId: base.referenceId,
          directionName: base.name,
        }),
      })
      if (res.ok) brief = (await res.json()).brief
    } catch {
      // 設計書が作れなくても標準デザインで生成を続行できる
    }
    saveChoice({
      choice: selection.type === 'candidate' ? 'candidate' : 'ai',
      referenceId: base.referenceId,
      directionName: base.name,
      brief: brief ?? undefined,
    })
    setProceeding(false)
    router.push('/wizard/step-6')
  }

  const isSelected = (c: Candidate) =>
    selection?.type === 'candidate' && selection.candidate.referenceId === c.referenceId

  return (
    <>
      <StepLayout
        stepId={6}
        title="デザインの好みを選ぶ"
        why="ここまでの回答をもとに、AIがあなたの事業に合いそうなデザインの方向性を提案します。好みを選ぶと、生成されるサイトの配色や雰囲気に反映されます。"
        onNext={proceed}
        nextLabel={proceeding ? '設計書を作成中…' : 'サイト生成へ'}
        nextDisabled={searching || proceeding}
        prevHref="/wizard/step-5"
      >
        {candidates === null && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">
              これまでの回答（業種・ターゲット・希望する雰囲気など）から、
              <br className="hidden sm:block" />
              参考になるデザインの方向性をAIが探します。
            </p>
            <Button onClick={searchCandidates} disabled={searching}>
              {searching ? 'AIが候補を探しています…' : 'デザイン候補を探す'}
            </Button>
          </div>
        )}

        {notice && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>
        )}

        {candidates && candidates.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {candidates.map((c) => (
                <DesignCandidateCard
                  key={c.referenceId}
                  name={c.name}
                  description={c.description}
                  features={c.features}
                  screenshotUrl={c.screenshotUrl}
                  selected={isSelected(c)}
                  onSelect={() => setSelection({ type: 'candidate', candidate: c })}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelection({ type: 'ai' })}
              aria-pressed={selection?.type === 'ai'}
              className={`rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                ${selection?.type === 'ai' ? 'border-accent-600 bg-accent-50 font-medium text-accent-800 ring-2 ring-accent-600' : 'border-slate-200 text-slate-600 hover:border-accent-400'}`}
            >
              {selection?.type === 'ai' ? '🤖 AIにおまかせ（選択中 ✓）' : '🤖 迷ったら「AIにおまかせ」'}
            </button>
            <p className="text-xs text-slate-400">
              選ばずに「サイト生成へ」進むこともできます（その場合は標準のデザインで生成します）
            </p>
          </>
        )}
      </StepLayout>
    </>
  )
}
