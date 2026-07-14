import { describe, expect, it } from 'vitest'
import { buildCardUpdateTool, describeCards } from './cardTool'
import { getAllQuestions } from './questions'
import { BusinessProfile } from '@/types/wizard'

const restaurant: BusinessProfile = { businessType: 'store', industry: 'restaurant' }

interface UpdatesSchema {
  properties: {
    updates: { items: { properties: { id: { enum: string[] } } } }
  }
}

describe('buildCardUpdateTool', () => {
  it('id の enum がプロファイルの質問IDと一致する', () => {
    const tool = buildCardUpdateTool(restaurant, 'fill_cards', 'テスト')
    const schema = tool.input_schema as unknown as UpdatesSchema
    expect(schema.properties.updates.items.properties.id.enum).toEqual(
      getAllQuestions(restaurant).map((q) => q.id),
    )
  })

  it('プロファイルによって enum が変わる（実店舗のみの質問など）', () => {
    const store = buildCardUpdateTool(restaurant, 'fill_cards', 'テスト')
    const online = buildCardUpdateTool(
      { businessType: 'online', industry: 'food-producer' },
      'fill_cards',
      'テスト',
    )
    const ids = (t: typeof store) =>
      (t.input_schema as unknown as UpdatesSchema).properties.updates.items.properties.id.enum
    expect(ids(store)).toContain('visit-trigger')
    expect(ids(store)).not.toContain('purchase-trigger')
    expect(ids(online)).toContain('purchase-trigger')
  })

  it('名前と説明が指定どおりに入る', () => {
    const tool = buildCardUpdateTool({}, 'propose_card_updates', '説明文')
    expect(tool.name).toBe('propose_card_updates')
    expect(tool.description).toBe('説明文')
  })
})

describe('describeCards', () => {
  it('全質問の id とタイトルを含む一覧を返す', () => {
    const text = describeCards(restaurant)
    for (const q of getAllQuestions(restaurant)) {
      expect(text).toContain(`- ${q.id}: ${q.title}`)
    }
  })
})
