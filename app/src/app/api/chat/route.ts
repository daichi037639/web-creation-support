import { streamChatWithCardTool, ChatMessage } from '@/lib/claude'
import { buildCardUpdateTool, describeCards } from '@/lib/cardTool'
import { buildPlanningContext } from '@/lib/questions'
import { WizardAnswers } from '@/types/wizard'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages, answers, stepContext, interviewMode } = (await req.json()) as {
    messages: ChatMessage[]
    answers?: WizardAnswers
    stepContext?: string
    interviewMode?: boolean
  }

  const profile = answers?.profile ?? {}
  const tool = buildCardUpdateTool(
    profile,
    'propose_card_updates',
    '会話からユーザーの回答が引き出せたときに、質問カードへ記入する内容を提案する。ユーザーが確認してからカードに反映される',
  )

  const systemPrompt = `あなたは日本の老舗企業や個人事業者がWebサイトを作るのを手伝うアシスタントです。
初心者でも理解できるように、やさしく、丁寧に日本語で答えてください。
専門用語を使う場合は必ずわかりやすい言葉で補足してください。

現在のステップ：${stepContext ?? '不明'}

ユーザーのこれまでの回答状況（「未定」の項目はまだ答えられていない質問です。
相談の流れで自然に引き出せそうなら、一度にひとつだけ、やさしく聞いてみてください）：
${buildPlanningContext(answers ?? {})}

【カードへの記入提案】
ユーザーの発言に質問カードの答えになる内容が含まれていたら、propose_card_updates ツールで
記入内容を提案してください。ルール：
- ユーザーが実際に話した内容だけを使う（勝手に創作しない）
- 記入文はユーザーの言葉をできるだけ活かして整える
- ツールを使うときは、本文にも「下の内容でカードに反映できます」のような一言を添える
質問カードの一覧：
${describeCards(profile)}`

  const interviewPrompt = `

【インタビューモード】
いまはあなたが聞き手です。回答状況で「未定」になっている質問の中から、この事業者が
答えやすそうなものを1つ選び、具体例を添えてやさしく質問してください。ルール：
- 質問は必ず1回に1つだけ
- ユーザーの答えを受け取ったら propose_card_updates でカードへの記入を提案し、
  ひとこと感想や励ましを添えて、次の質問へ進む
- 答えにくそうにしていたら、別の切り口の例を出すか、その質問を後回しにして次へ進む
- すべての質問が埋まったら、お礼を伝えて、ヘッダーの「入力状況を見る」から
  内容を確認・修正できることを案内して締めくくる`

  const stream = await streamChatWithCardTool(
    messages,
    interviewMode ? systemPrompt + interviewPrompt : systemPrompt,
    tool,
  )
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  })
}
