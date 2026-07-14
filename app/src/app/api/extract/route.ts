import { completeWithTool, CardUpdate } from '@/lib/claude'
import { buildCardUpdateTool } from '@/lib/cardTool'
import { getAllQuestions } from '@/lib/questions'
import { BusinessProfile } from '@/types/wizard'

export const runtime = 'nodejs'

/** 「まとめて話す」の自由入力（長文・音声入力由来）を各質問カードへ振り分ける */
export async function POST(req: Request) {
  const { text, profile } = (await req.json()) as {
    text: string
    profile?: BusinessProfile
  }

  if (!text?.trim()) {
    return Response.json({ error: 'テキストが空です' }, { status: 400 })
  }

  const tool = buildCardUpdateTool(
    profile ?? {},
    'fill_cards',
    '自由に書かれた事業の説明文から、各質問カードへの記入内容を抽出する',
  )

  const systemPrompt = `あなたは、日本の個人事業者が自由に話した（書いた）事業の説明文を読み、
Webサイト制作のための質問カードへ内容を振り分けるアシスタントです。
ルール：
- 説明文に書かれている内容だけを使う（推測で創作しない）
- 話し言葉でも、カードには読みやすい書き言葉に整える。ただし本人の言葉づかいをできるだけ活かす
- 該当する情報がないカードは updates に含めない
- 1つのカードにまとめる文章は2〜3文程度まで`

  try {
    const result = await completeWithTool<{ updates: CardUpdate[] }>(text, systemPrompt, tool)
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
