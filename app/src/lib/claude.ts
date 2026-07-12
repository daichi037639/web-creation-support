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

export async function completeText(
  userContent: string,
  systemPrompt: string,
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

// デザイン設計書がある場合にsystemプロンプトへ追加するルール
const DESIGN_RULES = `

デザイン設計書が提供されている場合は、配色・フォント・ファーストビュー・写真の扱い・余白・レイアウト・セクション構成・ボタン/CTA・スマートフォン表示のすべてに設計書の方針を反映してください。
その際、次のルールを厳守してください：
- 参考サイトから抽象化したデザイン原則だけを利用する
- 参考サイト固有の文章・ロゴ・画像・イラスト・コードは利用しない
- 参考サイトのレイアウトを完全に再現しない
- ユーザーの事業情報・要件を最優先する
- 設計書とユーザー要件を組み合わせ、独自のサイトを作る`

export async function generateSiteCode(
  context: string,
  codeType: 'static' | 'nextjs',
  hasDesignBrief = false,
): Promise<ReadableStream<Uint8Array>> {
  const basePrompt =
    codeType === 'static'
      ? `あなたはWebサイトを生成するAIです。提供された事業情報をもとに、美しく実用的な静的HTMLサイトを生成してください。
レスポンシブデザインを採用し、Tailwind CSS CDNを使用してください。
コードのみを出力し、説明文は不要です。`
      : `あなたはWebサイトを生成するAIです。提供された事業情報をもとに、Next.js（App Router）のコンポーネントを生成してください。
Tailwind CSSを使用し、TypeScriptで書いてください。
コードのみを出力し、説明文は不要です。`

  return streamChat(
    [{ role: 'user', content: context }],
    hasDesignBrief ? basePrompt + DESIGN_RULES : basePrompt,
  )
}
