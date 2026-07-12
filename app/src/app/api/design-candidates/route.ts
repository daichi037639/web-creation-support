import type { WizardAnswers } from '@/types/wizard'
import {
  fetchPublishedReferences,
  normalizeSearchProfile,
  pickCandidates,
  labelCandidates,
} from '@/lib/designCandidates'

export const runtime = 'nodejs'

// ウィザード回答からデザイン候補（原則3件）を返す。
// 参考データ不足・失敗時は fallback: true を返し、ウィザードは継続できる
export async function POST(req: Request) {
  let answers: WizardAnswers
  try {
    ;({ answers } = (await req.json()) as { answers: WizardAnswers })
  } catch {
    return Response.json({ error: '回答データが不正です' }, { status: 400 })
  }

  try {
    const references = await fetchPublishedReferences()
    if (references.length === 0) {
      return Response.json({ candidates: [], fallback: true })
    }

    const profile = await normalizeSearchProfile(answers)
    const picked = pickCandidates(profile, references)
    const candidates = await labelCandidates(picked, profile)
    return Response.json({ candidates, fallback: false })
  } catch (e) {
    console.error('design candidates failed:', e instanceof Error ? e.message : e)
    return Response.json({ candidates: [], fallback: true })
  }
}
