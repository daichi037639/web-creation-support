import { generateSiteCode } from '@/lib/claude'
import { buildPlanningContext } from '@/lib/questions'
import { briefToPromptText } from '@/lib/designMatch'
import { WizardAnswers } from '@/types/wizard'

export const runtime = 'nodejs'

function buildContext(answers: WizardAnswers): string {
  const a = answers
  const base = `
${buildPlanningContext(a)}

ページ構成: ${a.step4?.pages?.join(', ') ?? '未入力'}
問い合わせフォーム: ${a.step4?.hasContactForm ? 'あり' : 'なし'}
予約機能: ${a.step4?.hasReservation ? 'あり' : 'なし'}

トップページの文章: ${a.step5?.heroText ?? '未入力'}
自己紹介文: ${a.step5?.aboutText ?? '未入力'}
`.trim()

  // デザイン設計書があれば生成コンテキストに追加する（なければ従来どおり）
  const brief = a.design?.brief
  return brief ? `${base}\n\n${briefToPromptText(brief)}` : base
}

function detectCodeType(answers: WizardAnswers): 'static' | 'nextjs' {
  const step4 = answers.step4
  if (step4?.hasContactForm || step4?.hasReservation || step4?.hasEcommerce) {
    return 'nextjs'
  }
  return 'static'
}

export async function POST(req: Request) {
  const { answers } = (await req.json()) as { answers: WizardAnswers }
  const codeType = detectCodeType(answers)
  const context = buildContext(answers)
  const stream = await generateSiteCode(context, codeType, Boolean(answers.design?.brief))
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Code-Type': codeType,
    },
  })
}
