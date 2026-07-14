import { describe, expect, it } from 'vitest'
import { buildPlanningContext, countAnsweredCards, getQuestionsFor } from './questions'
import { BusinessProfile, CardAnswer } from '@/types/wizard'

const restaurant: BusinessProfile = { businessType: 'store', industry: 'restaurant' }
const onlineTea: BusinessProfile = { businessType: 'online', industry: 'food-producer' }

function answered(value = '回答'): CardAnswer {
  return { value, status: 'answered' }
}

describe('getQuestionsFor', () => {
  it('プロファイル未選択なら業態・業界の条件付き質問を出さない', () => {
    const ids = getQuestionsFor(2, {}).map((q) => q.id)
    expect(ids).not.toContain('visit-trigger')
    expect(ids).not.toContain('purchase-trigger')
    expect(ids).toContain('target-problem')
  })

  it('実店舗には来店のきっかけ、オンラインには購入の決め手を出す', () => {
    const storeIds = getQuestionsFor(2, restaurant).map((q) => q.id)
    expect(storeIds).toContain('visit-trigger')
    expect(storeIds).not.toContain('purchase-trigger')

    const onlineIds = getQuestionsFor(2, onlineTea).map((q) => q.id)
    expect(onlineIds).toContain('purchase-trigger')
    expect(onlineIds).not.toContain('visit-trigger')
  })

  it('業態=両方なら来店・購入の両方を出す', () => {
    const ids = getQuestionsFor(2, { businessType: 'both', industry: 'retail' }).map((q) => q.id)
    expect(ids).toContain('visit-trigger')
    expect(ids).toContain('purchase-trigger')
  })

  it('飲食店では「悩み」の質問が言い換えられる', () => {
    const q = getQuestionsFor(2, restaurant).find((x) => x.id === 'target-problem')
    expect(q?.label).toContain('気分・場面')
    expect(q?.title).toBe('お店を選ぶ場面')
  })

  it('variant がない業界はデフォルト文言のまま', () => {
    const q = getQuestionsFor(2, onlineTea).find((x) => x.id === 'target-problem')
    expect(q?.label).toContain('悩みや不満')
  })

  it('事業名と商品概要は「おすすめ」フラグを持つ（必須の概念は廃止）', () => {
    const step1 = getQuestionsFor(1, restaurant)
    expect(step1.find((q) => q.id === 'business-name')?.recommended).toBe(true)
    expect(step1.find((q) => q.id === 'products')?.recommended).toBe(true)
    expect(step1.find((q) => q.id === 'history')?.recommended).toBe(false)
  })
})

describe('countAnsweredCards', () => {
  it('プロファイルによって母数が変わる', () => {
    expect(countAnsweredCards({}, {}).total).toBeLessThan(
      countAnsweredCards({ businessType: 'both', industry: 'retail' }, {}).total,
    )
  })

  it('未入力は回答数に含めない', () => {
    const cards = {
      'business-name': answered(),
      products: { value: '', status: 'unanswered' } as CardAnswer,
    }
    expect(countAnsweredCards(restaurant, cards).answered).toBe(1)
  })
})

describe('buildPlanningContext', () => {
  it('回答済みは値を、未入力は補完前提の印を出す', () => {
    const context = buildPlanningContext({
      profile: restaurant,
      cards: {
        'business-name': answered('ひもかわ屋'),
        history: { value: '', status: 'unanswered' },
      },
      step3: { tone: '温かみ・親しみやすい' },
    })
    expect(context).toContain('事業・店舗の名前: ひもかわ屋')
    expect(context).toContain('あなたの会社の歴史: 未定（AIが内容から補完・提案する）')
    expect(context).toContain('業界: 飲食店')
    expect(context).toContain('トーン・雰囲気: 温かみ・親しみやすい')
  })

  it('業界=その他は自由入力の業界名を使う', () => {
    const context = buildPlanningContext({
      profile: { businessType: 'visit', industry: 'other', industryOther: '造園業' },
      cards: {},
    })
    expect(context).toContain('業界: 造園業')
  })
})
