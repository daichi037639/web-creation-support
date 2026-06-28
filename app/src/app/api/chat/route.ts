import { streamChat, ChatMessage } from '@/lib/claude'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages, systemContext } = (await req.json()) as {
    messages: ChatMessage[]
    systemContext: string
  }

  const systemPrompt = `あなたは日本の老舗企業や個人事業者がWebサイトを作るのを手伝うアシスタントです。
初心者でも理解できるように、やさしく、丁寧に日本語で答えてください。
専門用語を使う場合は必ずわかりやすい言葉で補足してください。

現在のステップのコンテキスト：${systemContext}`

  const stream = await streamChat(messages, systemPrompt)
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
