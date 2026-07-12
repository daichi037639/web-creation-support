import { describe, expect, it } from 'vitest'
import {
  buildPlanningContext,
  countAnsweredCards,
  getQuestionsFor,
  getRequiredIds,
  isStepClear,
} from './questions'
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
})

describe('isStepClear', () => {
  const requiredAnswered = {
    'business-name': answered('喜多の園'),
    products: answered('お茶の販売'),
  }

  it('STEP 1 は必須カード回答済みでも業態・業界未選択ならクリア不可', () => {
    expect(isStepClear(1, {}, requiredAnswered)).toBe(false)
    expect(isStepClear(1, restaurant, requiredAnswered)).toBe(true)
  })

  it('必須カードは保留のままではクリア不可', () => {
    const cards = { ...requiredAnswered, products: { value: '', status: 'deferred' } as CardAnswer }
    expect(isStepClear(1, restaurant, cards)).toBe(false)
  })

  it('必須のない STEP 2 は全カード保留でもクリアできる', () => {
    expect(getRequiredIds(2, restaurant)).toEqual([])
    expect(isStepClear(2, restaurant, {})).toBe(true)
  })
})

describe('countAnsweredCards', () => {
  it('プロファイルによって母数が変わる', () => {
    expect(countAnsweredCards({}, {}).total).toBeLessThan(
      countAnsweredCards({ businessType: 'both', industry: 'retail' }, {}).total,
    )
  })

  it('保留・未入力は回答数に含めない', () => {
    const cards = {
      'business-name': answered(),
      products: { value: '', status: 'deferred' } as CardAnswer,
    }
    expect(countAnsweredCards(restaurant, cards).answered).toBe(1)
  })
})

describe('buildPlanningContext', () => {
  it('回答済みは値を、保留・未入力は補完前提の印を出す', () => {
    const context = buildPlanningContext({
      profile: restaurant,
      cards: {
        'business-name': answered('ひもかわ屋'),
        history: { value: '', status: 'deferred' },
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
