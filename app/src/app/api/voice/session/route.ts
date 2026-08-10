import {
  REALTIME_MODEL,
  buildInterviewInstructions,
  buildVoiceTools,
} from '@/lib/voiceInterview'
import { WizardAnswers } from '@/types/wizard'

export const runtime = 'nodejs'

/**
 * OpenAI Realtime 用の一時クライアントキーを発行する。
 * APIキー本体はサーバー内に留め、ブラウザには短寿命のキーだけを渡す。
 * インタビューの指示・回答状況・ツール定義もここでセッションに焼き込む
 */
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'OPENAI_API_KEY が設定されていません' }, { status: 500 })
  }

  const { answers } = (await req.json().catch(() => ({}))) as { answers?: WizardAnswers }

  const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: 600 },
      session: {
        type: 'realtime',
        model: REALTIME_MODEL,
        instructions: buildInterviewInstructions(answers ?? {}),
        tools: buildVoiceTools(answers?.profile ?? {}),
        audio: {
          input: {
            transcription: { model: 'gpt-4o-mini-transcribe', language: 'ja' },
            // semantic_vad は「話し終わったか」を意味で判定する。相槌への誤反応が減り会話が自然になる
            turn_detection: { type: 'semantic_vad' },
          },
          output: { voice: 'marin' },
        },
      },
    }),
  })

  if (!res.ok) {
    console.error('OpenAI client_secrets error:', res.status, await res.text())
    return Response.json({ error: '音声セッションの作成に失敗しました' }, { status: 502 })
  }

  const data = (await res.json()) as { value: string }
  return Response.json({ clientSecret: data.value, model: REALTIME_MODEL })
}
