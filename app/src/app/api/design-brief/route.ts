import type { WizardAnswers } from '@/types/wizard'
import { fetchPublishedReference, buildDesignBrief } from '@/lib/designBrief'

export const runtime = 'nodejs'

// 選択した候補からデザイン設計書を作る。
// brief が null の場合、クライアントは標準デザイン生成のまま進む
export async function POST(req: Request) {
  let body: { answers: WizardAnswers; referenceId?: string; directionName?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'リクエストが不正です' }, { status: 400 })
  }

  const reference = body.referenceId
    ? await fetchPublishedReference(body.referenceId)
    : null
  const brief = await buildDesignBrief(body.answers, reference, body.directionName)
  return Response.json({ brief })
}
