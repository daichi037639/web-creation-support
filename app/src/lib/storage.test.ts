import { describe, expect, it } from 'vitest'
import { migrateDeferredCards, migrateLegacyAnswers, updateCards } from './storage'
import { CardAnswer, WizardAnswers, WizardState } from '@/types/wizard'

describe('migrateLegacyAnswers', () => {
  it('v0.4 以前の step1〜3 の回答をカードへ変換する', () => {
    const migrated = migrateLegacyAnswers({
      step1: { businessName: '喜多の園', products: 'お茶', strengths: '', history: '三代目' },
      step2: { targetProblem: '産地がわからない' },
      step3: { mainMessage: '産地直送', tone: '上品・高級感' },
    })
    expect(migrated.cards).toEqual({
      'business-name': { value: '喜多の園', status: 'answered' },
      products: { value: 'お茶', status: 'answered' },
      history: { value: '三代目', status: 'answered' },
      'target-problem': { value: '産地がわからない', status: 'answered' },
      'main-message': { value: '産地直送', status: 'answered' },
    })
    expect(migrated.step3).toEqual({ tone: '上品・高級感' })
  })

  it('空文字・空白のみの旧回答はカードを作らない', () => {
    const migrated = migrateLegacyAnswers({ step1: { businessName: '  ' } })
    expect(migrated.cards).toEqual({})
  })

  it('新形式（cards あり）はそのまま返す', () => {
    const answers: WizardAnswers = {
      cards: { products: { value: 'お茶', status: 'answered' } },
      step3: { tone: '上品・高級感' },
    }
    expect(migrateLegacyAnswers(answers)).toBe(answers)
  })

  it('旧形式のキーが無ければそのまま返す', () => {
    const answers: WizardAnswers = { step4: { pages: ['トップ（ホーム）'] } }
    expect(migrateLegacyAnswers(answers)).toBe(answers)
  })

  it('step4〜6 の回答は移行後も維持される', () => {
    const migrated = migrateLegacyAnswers({
      step1: { businessName: '喜多の園' },
      step4: { pages: ['トップ（ホーム）'], hasContactForm: true },
      step5: { heroText: 'こんにちは' },
    })
    expect(migrated.step4?.hasContactForm).toBe(true)
    expect(migrated.step5?.heroText).toBe('こんにちは')
  })
})

describe('updateCards', () => {
  it('既存カードを保ったまま追加・上書きする', () => {
    const state: WizardState = {
      currentStep: 1,
      completedSteps: [],
      answers: { cards: { products: { value: 'お茶', status: 'answered' } } },
    }
    const next = updateCards(state, { history: { value: '三代目', status: 'answered' } })
    expect(next.answers.cards).toEqual({
      products: { value: 'お茶', status: 'answered' },
      history: { value: '三代目', status: 'answered' },
    })
    expect(state.answers.cards).not.toHaveProperty('history')
  })
})

describe('migrateDeferredCards', () => {
  const deferred = { value: '', status: 'deferred' } as unknown as CardAnswer

  it('廃止した「あとで考える」ステータスを未入力へ戻す', () => {
    const migrated = migrateDeferredCards({
      cards: {
        products: { value: 'お茶', status: 'answered' },
        history: deferred,
      },
    })
    expect(migrated.cards).toEqual({
      products: { value: 'お茶', status: 'answered' },
      history: { value: '', status: 'unanswered' },
    })
  })

  it('保留時の下書きテキストは消さずに残す', () => {
    const withDraft = { value: '書きかけ', status: 'deferred' } as unknown as CardAnswer
    const migrated = migrateDeferredCards({ cards: { history: withDraft } })
    expect(migrated.cards?.history).toEqual({ value: '書きかけ', status: 'unanswered' })
  })

  it('deferred がなければそのまま返す', () => {
    const answers: WizardAnswers = {
      cards: { products: { value: 'お茶', status: 'answered' } },
    }
    expect(migrateDeferredCards(answers)).toBe(answers)
    expect(migrateDeferredCards({})).toEqual({})
  })
})
