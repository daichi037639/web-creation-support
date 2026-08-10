import { randomUUID } from 'node:crypto'
import type Anthropic from '@anthropic-ai/sdk'
import { completeWithTool } from '@/lib/claude'
import { MAX_MATERIALS } from '@/lib/materials'
import { getSession } from '@/lib/supabase/sessions'
import { uploadMaterialImage, removeMaterialImage } from '@/lib/supabase/materials'
import { UUID_RE } from '@/lib/uuid'
import type { MaterialImage, MaterialKind } from '@/types/wizard'

export const runtime = 'nodejs'

/** base64で約7MB（/api/extract と同じ目安） */
const MAX_IMAGE_CHARS = 7_000_000

interface MaterialUploadImage {
  data: string
  mediaType: string
}

const KIND_VALUES: MaterialKind[] = ['product', 'exterior', 'interior', 'people', 'logo', 'other']

const DESCRIBE_TOOL: Anthropic.Tool = {
  name: 'describe_materials',
  description: 'Webサイトに載せる写真素材を1枚ずつ分類し、短い説明を付ける',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'integer', description: '写真の番号（0始まり、送られた順）' },
            kind: { type: 'string', enum: KIND_VALUES },
            caption: { type: 'string', description: '20字程度の日本語の説明' },
          },
          required: ['index', 'kind', 'caption'],
        },
      },
    },
    required: ['items'],
  },
}

const DESCRIBE_SYSTEM = `あなたは、事業者のWebサイトに載せる写真素材を分類するアシスタントです。
各写真について、種類（product=商品 / exterior=店舗外観 / interior=店内 / people=人物 / logo=ロゴ / other=その他）と、
サイト制作者が使い道を判断できる20字程度の日本語キャプションを付けてください。
写っている事実だけを書き、店名や商品名を推測で創作しないでください。`

interface DescribeResult {
  items?: { index: number; kind: string; caption: string }[]
}

/** 各写真の種類とキャプションをAIで判定する。失敗しても既定値でアップロードは成立させる */
async function describeMaterials(
  images: MaterialUploadImage[],
): Promise<{ kind: MaterialKind; caption: string }[]> {
  const fallback = images.map(() => ({ kind: 'other' as MaterialKind, caption: '' }))
  try {
    const content: Anthropic.ContentBlockParam[] = [
      ...images.map(
        (i): Anthropic.ImageBlockParam => ({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: i.data },
        }),
      ),
      { type: 'text', text: '添付した写真を送られた順（index 0始まり）に分類してください。' },
    ]
    const result = await completeWithTool<DescribeResult>(content, DESCRIBE_SYSTEM, DESCRIBE_TOOL)
    for (const item of result?.items ?? []) {
      if (item.index < 0 || item.index >= fallback.length) continue
      fallback[item.index] = {
        kind: KIND_VALUES.includes(item.kind as MaterialKind) ? (item.kind as MaterialKind) : 'other',
        caption: item.caption?.trim() ?? '',
      }
    }
    return fallback
  } catch {
    return fallback
  }
}

/** セッションの実在確認。同期テーブル未作成の環境ではチェックを諦めて通す */
async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    return (await getSession(sessionId)) !== null
  } catch {
    return true
  }
}

/** 素材写真をアップロードし、AIが付けた種類・キャプションと公開URLを返す */
export async function POST(req: Request) {
  const { sessionId, images } = (await req.json()) as {
    sessionId?: string
    images?: MaterialUploadImage[]
  }

  if (!sessionId || !UUID_RE.test(sessionId)) {
    return Response.json({ error: 'セッションIDが不正です' }, { status: 400 })
  }
  const validImages = (images ?? []).filter((i) => i.mediaType === 'image/jpeg')
  if (validImages.length === 0 || validImages.length > MAX_MATERIALS) {
    return Response.json({ error: `写真は1〜${MAX_MATERIALS}枚で送ってください` }, { status: 400 })
  }
  if (validImages.reduce((sum, i) => sum + i.data.length, 0) > MAX_IMAGE_CHARS) {
    return Response.json({ error: '写真のサイズが大きすぎます' }, { status: 400 })
  }
  if (!(await sessionExists(sessionId))) {
    return Response.json({ error: 'セッションが見つかりませんでした' }, { status: 404 })
  }

  const uploaded: { image: MaterialUploadImage; id: string; url: string }[] = []
  for (const image of validImages) {
    const id = randomUUID()
    const url = await uploadMaterialImage(sessionId, id, Buffer.from(image.data, 'base64'))
    if (url) uploaded.push({ image, id, url })
  }
  if (uploaded.length === 0) {
    return Response.json({ error: 'アップロードに失敗しました。時間をおいて試してください' }, { status: 500 })
  }

  const described = await describeMaterials(uploaded.map((u) => u.image))
  const materials: MaterialImage[] = uploaded.map((u, i) => ({
    id: u.id,
    url: u.url,
    kind: described[i].kind,
    caption: described[i].caption,
  }))
  return Response.json({ materials })
}

/** 素材写真を Storage から削除する */
export async function DELETE(req: Request) {
  const { sessionId, materialId } = (await req.json()) as {
    sessionId?: string
    materialId?: string
  }

  // パス組み立てに使うため、両方とも厳密にUUID形式のみ受け付ける
  if (!sessionId || !UUID_RE.test(sessionId) || !materialId || !UUID_RE.test(materialId)) {
    return Response.json({ error: 'IDが不正です' }, { status: 400 })
  }

  const ok = await removeMaterialImage(sessionId, materialId)
  if (!ok) {
    return Response.json({ error: '削除に失敗しました' }, { status: 500 })
  }
  return Response.json({ ok: true })
}
