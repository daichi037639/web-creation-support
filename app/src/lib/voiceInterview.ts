import { buildPlanningContext, getAllQuestions } from '@/lib/questions'
import { BusinessProfile, WizardAnswers } from '@/types/wizard'

/** 音声対話UIの状態。ユーザーに「いま何が起きているか」を伝えるために使う */
export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'muted'
  | 'ended'
  | 'error'

export interface VoiceCardUpdate {
  id: string
  value: string
}

export const REALTIME_MODEL = 'gpt-realtime'
export const SAVE_ANSWERS_TOOL = 'save_answers'
export const END_INTERVIEW_TOOL = 'end_interview'

/** OpenAI Realtime API の function tool 定義（Anthropic形式の cardTool とはスキーマの置き場所が違う） */
export interface RealtimeFunctionTool {
  type: 'function'
  name: string
  description: string
  parameters: object
}

export function buildVoiceTools(profile: BusinessProfile): RealtimeFunctionTool[] {
  // id を enum で縛り、存在しないカードへの書き込みをスキーマ段階で防ぐ（cardTool.ts と同じ考え方）
  const ids = getAllQuestions(profile).map((q) => q.id)
  return [
    {
      type: 'function',
      name: SAVE_ANSWERS_TOOL,
      description:
        '会話からユーザーの回答が引き出せたときに、質問カードへ保存する。1回の呼び出しで複数のカードをまとめて保存できる',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            description: '保存する質問カードの一覧',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: ids, description: '質問カードのID' },
                value: {
                  type: 'string',
                  description:
                    'カードに保存する文章。ユーザー自身の言葉をできるだけ活かし、簡潔にまとめる',
                },
              },
              required: ['id', 'value'],
            },
          },
        },
        required: ['updates'],
      },
    },
    {
      type: 'function',
      name: END_INTERVIEW_TOOL,
      description:
        'インタビューを終了する。すべての質問を聞き終えるか、ユーザーが終了を望んだとき、お別れの挨拶を話し終えたあとに呼ぶ',
      parameters: { type: 'object', properties: {} },
    },
  ]
}

/** Realtime セッションに渡すインタビュアーの指示文。回答状況とカード一覧を含む */
export function buildInterviewInstructions(answers: WizardAnswers): string {
  const profile = answers.profile ?? {}
  const cardList = getAllQuestions(profile)
    .map((q) => `- ${q.id}: ${q.title}（${q.label}）`)
    .join('\n')

  return `あなたは「Webサイト制作支援サービス」の音声インタビュアーです。
日本の老舗企業や個人事業者の方から、Webサイトを作るために必要な情報を、音声の会話でやさしく聞き出してください。

【話し方】
- 必ず日本語で話す。あたたかく丁寧に、親しみやすい聞き手として振る舞う
- 音声の会話なので、1回の発話は短く（2〜3文まで）。長い説明はしない
- 専門用語を使わない。Webやマーケティングを知らない人でも答えられる言葉で聞く
- 質問は必ず1回にひとつだけ

【インタビューの進め方】
- 最初の発話では、短い挨拶と「いくつか質問させてください」という導入に続けて、最初の質問をする
- 相手の答えには、まず「なるほど、〇〇なんですね」のように自然にリアクションしてから次に進む
- 答えが浅いときは一度だけやさしく深掘りする（例：「ちなみに、どんなお客様が多いですか？」）
- 答えにくそうなら、具体例を出すか、その質問は後回しにして別の質問へ進む
- 下の【回答状況】で「未定」となっている項目だけを聞く。すでに回答がある項目を聞き直さない
- 相手がひとつの発言で複数の質問に触れたら、まとめて保存してよい

【回答の保存】
- 相手の発言から回答が得られたら、${SAVE_ANSWERS_TOOL} ツールで質問カードへ保存する
- 保存する文章は相手の言葉をできるだけ活かして簡潔にまとめる。話していない内容を創作しない
- 保存したことをいちいち口に出さない。保存のあとは、リアクションと次の質問を自然に続ける

【終了】
- 「未定」の項目がなくなったら、お礼と「入力内容はあとから画面で確認・修正できます」を伝え、
  話し終えてから ${END_INTERVIEW_TOOL} ツールを呼ぶ
- 相手が「終わりたい」「もういい」と言ったときも、お礼を伝えてから同じように終了する

【回答状況】（「未定」= まだ聞けていない質問）
${buildPlanningContext(answers)}

【質問カードの一覧】
${cardList}`
}

/** save_answers の引数JSONを検証つきでパースする。壊れたJSON・未知のカードID・空文字は捨てる */
export function parseCardUpdates(argsJson: string, profile: BusinessProfile): VoiceCardUpdate[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(argsJson)
  } catch {
    return []
  }
  const updates = (parsed as { updates?: unknown } | null)?.updates
  if (!Array.isArray(updates)) return []

  const validIds = new Set(getAllQuestions(profile).map((q) => q.id))
  const result: VoiceCardUpdate[] = []
  for (const u of updates) {
    if (!u || typeof u !== 'object') continue
    const { id, value } = u as { id?: unknown; value?: unknown }
    if (typeof id !== 'string' || typeof value !== 'string') continue
    if (!validIds.has(id) || value.trim() === '') continue
    result.push({ id, value: value.trim() })
  }
  return result
}
