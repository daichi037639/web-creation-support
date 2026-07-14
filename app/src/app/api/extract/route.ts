import type Anthropic from '@anthropic-ai/sdk'
import { completeWithTool, CardUpdate } from '@/lib/claude'
import { buildCardUpdateTool } from '@/lib/cardTool'
import { getAllQuestions } from '@/lib/questions'
import { BusinessProfile } from '@/types/wizard'

export const runtime = 'nodejs'

const MAX_IMAGES = 3
/** base64で約7MB（画像1枚あたりのAPI上限5MBに余裕を持たせた全体の目安） */
const MAX_IMAGE_CHARS = 7_000_000

interface ExtractImage {
  data: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * 「まとめて話す」の自由入力（長文・音声入力由来）や、パンフレット・チラシなどの
 * 資料写真から、各質問カードへの記入内容を振り分ける
 */
export async function POST(req: Request) {
  const { text, images, profile } = (await req.json()) as {
    text?: string
    images?: ExtractImage[]
    profile?: BusinessProfile
  }

  const validImages = (images ?? [])
    .filter((i) => ['image/jpeg', 'image/png', 'image/webp'].includes(i.mediaType))
    .slice(0, MAX_IMAGES)

  if (!text?.trim() && validImages.length === 0) {
    return Response.json({ error: 'テキストか写真のどちらかを入れてください' }, { status: 400 })
  }
  if (validImages.reduce((sum, i) => sum + i.data.length, 0) > MAX_IMAGE_CHARS) {
    return Response.json({ error: '写真のサイズが大きすぎます' }, { status: 400 })
  }

  const tool = buildCardUpdateTool(
    profile ?? {},
    'fill_cards',
    '事業の説明文や資料の写真から、各質問カードへの記入内容を抽出する',
  )

  const systemPrompt = `あなたは、日本の個人事業者が自由に話した（書いた）事業の説明文や、
パンフレット・チラシ・メニューなどの資料の写真を読み、
Webサイト制作のための質問カードへ内容を振り分けるアシスタントです。
ルール：
- 説明文・資料に書かれている内容だけを使う（推測で創作しない）
- 話し言葉でも、カードには読みやすい書き言葉に整える。ただし本人の言葉づかいをできるだけ活かす
- 写真からは事業内容・こだわり・歴史・ターゲットなどの事実を読み取る（デザインの感想は不要）
- 該当する情報がないカードは updates に含めない
- 1つのカードにまとめる文章は2〜3文程度まで`

  const content: Anthropic.ContentBlockParam[] = [
    ...validImages.map(
      (i): Anthropic.ImageBlockParam => ({
        type: 'image',
        source: { type: 'base64', media_type: i.mediaType, data: i.data },
      }),
    ),
    {
      type: 'text',
      text: text?.trim()
        ? text
        : '添付した資料の写真から読み取れる内容を、質問カードへ振り分けてください。',
    },
  ]

  try {
    const result = await completeWithTool<{ updates: CardUpdate[] }>(content, systemPrompt, tool)
    const titles = new Map(getAllQuestions(profile ?? {}).map((q) => [q.id, q.title]))
    const updates = (result?.updates ?? [])
      .filter((u) => u.value.trim() !== '')
      .map((u) => ({ ...u, title: titles.get(u.id) ?? u.id }))
    return Response.json({ updates })
  } catch {
    return Response.json(
      { error: '内容の振り分けに失敗しました。時間をおいて試してください' },
      { status: 500 },
    )
  }
}
