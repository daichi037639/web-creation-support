import { describe, expect, it } from 'vitest'
import {
  END_INTERVIEW_TOOL,
  SAVE_ANSWERS_TOOL,
  buildInterviewInstructions,
  buildVoiceTools,
  parseCardUpdates,
} from '@/lib/voiceInterview'
import { BusinessProfile, WizardAnswers } from '@/types/wizard'

const storeProfile: BusinessProfile = { businessType: 'store', industry: 'restaurant' }

describe('buildVoiceTools', () => {
  it('保存ツールと終了ツールの2つを返す', () => {
    const names = buildVoiceTools({}).map((t) => t.name)
    expect(names).toEqual([SAVE_ANSWERS_TOOL, END_INTERVIEW_TOOL])
  })

  it('カードIDのenumがプロファイルで出し分けされる', () => {
    const json = JSON.stringify(buildVoiceTools(storeProfile))
    expect(json).toContain('"visit-trigger"')
    // 実店舗のみのプロファイルにはオンライン販売向けカードは出ない
    expect(json).not.toContain('"purchase-trigger"')
  })
})

describe('buildInterviewInstructions', () => {
  const answers: WizardAnswers = {
    profile: storeProfile,
    cards: { products: { value: 'ひもかわうどんの店', status: 'answered' } },
  }

  it('回答済みの内容と未定の項目を含む', () => {
    const text = buildInterviewInstructions(answers)
    expect(text).toContain('ひもかわうどんの店')
    expect(text).toContain('未定')
  })

  it('ツール名とカードIDの一覧を含む', () => {
    const text = buildInterviewInstructions(answers)
    expect(text).toContain(SAVE_ANSWERS_TOOL)
    expect(text).toContain(END_INTERVIEW_TOOL)
    expect(text).toContain('- business-name:')
  })

  it('回答が空でも組み立てられる', () => {
    expect(buildInterviewInstructions({})).toContain('【回答状況】')
  })
})

describe('parseCardUpdates', () => {
  it('正しい引数をパースして前後の空白を落とす', () => {
    const json = JSON.stringify({ updates: [{ id: 'products', value: '  お茶の販売  ' }] })
    expect(parseCardUpdates(json, {})).toEqual([{ id: 'products', value: 'お茶の販売' }])
  })

  it('壊れたJSONは空配列を返す', () => {
    expect(parseCardUpdates('{oops', {})).toEqual([])
  })

  it('updatesが配列でなければ空配列を返す', () => {
    expect(parseCardUpdates('{"updates": "products"}', {})).toEqual([])
    expect(parseCardUpdates('null', {})).toEqual([])
  })

  it('未知のカードID・空文字・型違いの要素を捨てる', () => {
    const json = JSON.stringify({
      updates: [
        { id: 'unknown-card', value: 'x' },
        { id: 'products', value: '   ' },
        { id: 'products', value: 123 },
        'not-an-object',
        { id: 'strengths', value: '有機栽培' },
      ],
    })
    expect(parseCardUpdates(json, {})).toEqual([{ id: 'strengths', value: '有機栽培' }])
  })

  it('プロファイルで非表示のカードIDを捨てる', () => {
    const json = JSON.stringify({ updates: [{ id: 'purchase-trigger', value: 'レビュー' }] })
    expect(parseCardUpdates(json, storeProfile)).toEqual([])
  })
})
