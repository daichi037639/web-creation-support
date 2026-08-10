import type Anthropic from '@anthropic-ai/sdk'
import { completeWithToolLarge } from '@/lib/claude'
import {
  applyEditOperation,
  buildEditContext,
  buildEditSystemPrompt,
  buildEditToolSchema,
  type EditOperationInput,
} from '@/lib/site/edit'
import type { SiteData } from '@/types/site'

export const runtime = 'nodejs'
export const maxDuration = 120

interface EditRequest {
  site: SiteData
  request: string
  selectedSectionId?: string
}

/**
 * 自然言語による部分編集（LOG-015）。
 * 全再生成せず、AIが選んだ最小操作を validation 付きで適用して返す。
 * 返却: {applied, message, site?}
 */
export async function POST(req: Request) {
  const { site, request, selectedSectionId } = (await req.json()) as EditRequest
  if (!site || !request?.trim()) {
    return Response.json(
      { applied: false, message: '編集内容を入力してください' },
      { status: 400 },
    )
  }

  try {
    const op = await completeWithToolLarge<EditOperationInput>(
      buildEditContext(site, request.trim(), selectedSectionId),
      buildEditSystemPrompt(),
      {
        name: 'edit_site',
        description: 'サイトへの最小の編集操作を1つ適用する',
        input_schema: buildEditToolSchema() as Anthropic.Tool['input_schema'],
      },
      { maxTokens: 16000 },
    )
    if (!op) {
      return Response.json({
        applied: false,
        message: 'うまく解釈できませんでした。別の言い方で試してください。',
      })
    }

    const result = applyEditOperation(site, op)
    if (!result.ok) {
      // 'none'（質問への回答・できない理由）もここに含まれる
      return Response.json({ applied: false, message: result.error })
    }
    return Response.json({
      applied: true,
      message: op.explanation || '変更を適用しました',
      site: result.site,
    })
  } catch (e) {
    console.error('site edit failed:', e instanceof Error ? e.message : e)
    return Response.json(
      { applied: false, message: '編集に失敗しました。時間をおいて再度お試しください。' },
      { status: 500 },
    )
  }
}
