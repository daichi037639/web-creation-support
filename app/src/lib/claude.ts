import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** チャット・一括入力からカードへ書き込む提案。id は質問バンクの質問ID */
export interface CardUpdate {
  id: string
  value: string
}

/**
 * NDJSONで返すチャットストリーム。1行 = 1イベント：
 * {type:'text', text} … 本文の差分 / {type:'updates', updates} … カード記入の提案
 */
export async function streamChatWithCardTool(
  messages: ChatMessage[],
  systemPrompt: string,
  tool: Anthropic.Tool,
): Promise<ReadableStream<Uint8Array>> {
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
    tools: [tool],
  })

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          emit({ type: 'text', text: chunk.delta.text })
        }
      }
      // tool入力（JSON）は差分では扱いにくいため、完成したメッセージからまとめて取り出す
      const final = await stream.finalMessage()
      for (const block of final.content) {
        if (block.type === 'tool_use' && block.name === tool.name) {
          const input = block.input as { updates?: CardUpdate[] }
          if (input.updates?.length) emit({ type: 'updates', updates: input.updates })
        }
      }
      controller.close()
    },
  })
}

/** tool_choice で1つのツールを強制し、その入力JSONだけを返す（structured output） */
export async function completeWithTool<T>(
  userContent: string,
  systemPrompt: string,
  tool: Anthropic.Tool,
): Promise<T | null> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
  })
  const block = response.content.find((b) => b.type === 'tool_use')
  return block && block.type === 'tool_use' ? (block.input as T) : null
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
