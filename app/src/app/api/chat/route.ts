import { streamChat, ChatMessage } from '@/lib/claude'
import { buildPlanningContext } from '@/lib/questions'
import { WizardAnswers } from '@/types/wizard'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages, answers, stepContext } = (await req.json()) as {
    messages: ChatMessage[]
    answers?: WizardAnswers
    stepContext?: string
  }

  const systemPrompt = `あなたは日本の老舗企業や個人事業者がWebサイトを作るのを手伝うアシスタントです。
初心者でも理解できるように、やさしく、丁寧に日本語で答えてください。
専門用語を使う場合は必ずわかりやすい言葉で補足してください。

現在のステップ：${stepContext ?? '不明'}

ユーザーのこれまでの回答状況（「未定」の項目はまだ答えられていない質問です。
相談の流れで自然に引き出せそうなら、一度にひとつだけ、やさしく聞いてみてください）：
${buildPlanningContext(answers ?? {})}`

  const stream = await streamChat(messages, systemPrompt)
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
