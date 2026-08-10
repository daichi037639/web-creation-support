import { generateSite } from '@/lib/site/generate'
import type { WizardAnswers } from '@/types/wizard'

export const runtime = 'nodejs'
// 生成は2回のAI呼び出しで数十秒かかる
export const maxDuration = 300

/**
 * Component-driven サイト生成。NDJSONで進捗とサイトデータを返す。
 * {type:'stage', stage} … 進捗 / {type:'site', site, issues} … 完成
 * {type:'error', message} … 失敗
 */
export async function POST(req: Request) {
  const { answers } = (await req.json()) as { answers: WizardAnswers }
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      try {
        const { site, issues } = await generateSite(answers, (p) =>
          emit({ type: 'stage', stage: p.stage }),
        )
        emit({ type: 'site', site, issues })
      } catch (e) {
        console.error('site generation failed:', e instanceof Error ? e.message : e)
        emit({ type: 'error', message: '生成に失敗しました。時間をおいて再度お試しください。' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  })
}
