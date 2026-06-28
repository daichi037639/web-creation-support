import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function streamChat(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })
}

export async function generateSiteCode(
  context: string,
  codeType: 'static' | 'nextjs',
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt =
    codeType === 'static'
      ? `あなたはWebサイトを生成するAIです。提供された事業情報をもとに、美しく実用的な静的HTMLサイトを生成してください。
レスポンシブデザインを採用し、Tailwind CSS CDNを使用してください。
コードのみを出力し、説明文は不要です。`
      : `あなたはWebサイトを生成するAIです。提供された事業情報をもとに、Next.js（App Router）のコンポーネントを生成してください。
Tailwind CSSを使用し、TypeScriptで書いてください。
コードのみを出力し、説明文は不要です。`

  return streamChat(
    [{ role: 'user', content: context }],
    systemPrompt,
  )
}
