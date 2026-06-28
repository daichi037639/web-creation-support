import { generateSiteCode } from '@/lib/claude'
import { WizardAnswers } from '@/types/wizard'

export const runtime = 'nodejs'

function buildContext(answers: WizardAnswers): string {
  const a = answers
  return `
事業名: ${a.step1?.businessName ?? '未入力'}
商品・サービス: ${a.step1?.products ?? '未入力'}
強み・こだわり: ${a.step1?.strengths ?? '未入力'}
歴史・背景: ${a.step1?.history ?? '未入力'}

ターゲット年代: ${a.step2?.targetAge ?? '未入力'}
ターゲットの悩み: ${a.step2?.targetProblem ?? '未入力'}
ターゲットの願望: ${a.step2?.targetDesire ?? '未入力'}

メインメッセージ: ${a.step3?.mainMessage ?? '未入力'}
トーン・雰囲気: ${a.step3?.tone ?? '未入力'}

ページ構成: ${a.step4?.pages?.join(', ') ?? '未入力'}
問い合わせフォーム: ${a.step4?.hasContactForm ? 'あり' : 'なし'}
予約機能: ${a.step4?.hasReservation ? 'あり' : 'なし'}

トップページの文章: ${a.step5?.heroText ?? '未入力'}
自己紹介文: ${a.step5?.aboutText ?? '未入力'}
`.trim()
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
  const stream = await generateSiteCode(context, codeType)
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Code-Type': codeType,
    },
  })
}
