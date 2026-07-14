import type Anthropic from '@anthropic-ai/sdk'
import { getAllQuestions } from '@/lib/questions'
import { BusinessProfile } from '@/types/wizard'

/**
 * 質問カードへ記入するためのツール定義（チャットの提案・一括入力の振り分けで共用）。
 * id を enum で縛ることで、存在しないカードへの書き込みをスキーマ段階で防ぐ
 */
export function buildCardUpdateTool(
  profile: BusinessProfile,
  name: string,
  description: string,
): Anthropic.Tool {
  const questions = getAllQuestions(profile)
  return {
    name,
    description,
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          description: '記入する質問カードの一覧',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: questions.map((q) => q.id),
                description: '質問カードのID',
              },
              value: {
                type: 'string',
                description:
                  'カードに記入する文章。ユーザー自身の言葉をできるだけ活かし、簡潔にまとめる',
              },
            },
            required: ['id', 'value'],
          },
        },
      },
      required: ['updates'],
    },
  }
}

/** プロンプトに載せる「カードID: 質問」の一覧 */
export function describeCards(profile: BusinessProfile): string {
  return getAllQuestions(profile)
    .map((q) => `- ${q.id}: ${q.title}（${q.label}）`)
    .join('\n')
}
