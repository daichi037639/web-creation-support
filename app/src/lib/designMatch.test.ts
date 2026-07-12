import { describe, it, expect } from 'vitest'
import type { DesignReference } from '@/types/designReference'
import {
  fallbackSearchProfile,
  scoreReference,
  selectDiverse,
  fallbackDirectionName,
  parseSearchProfile,
  parseCandidateLabels,
  parseDesignBrief,
  briefToPromptText,
  SearchProfile,
} from './designMatch'

function makeRef(overrides: Partial<DesignReference>): DesignReference {
  return {
    id: 'id-' + Math.random().toString(36).slice(2, 8),
    url: 'https://example.com',
    title: 'テストサイト',
    industry: 'その他',
    style_tags: [],
    summary: '',
    analysis: {
      colorScheme: '',
      layout: '',
      typography: '',
      tone: '',
      targetAudience: '',
      takeaways: [],
    },
    status: 'published',
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

const baseProfile: SearchProfile = {
  industry: '飲食店',
  purpose: '来店を増やす',
  target: '地元の家族連れ',
  impressions: ['和風', '高級感'],
  axes: { era: '伝統的' },
}

describe('fallbackSearchProfile', () => {
  it('トーン文字列から軸を推定する', () => {
    const p = fallbackSearchProfile({
      industryLabel: '飲食店',
      tone: '高級感があり、伝統を感じる落ち着いた雰囲気',
    })
    expect(p.axes.luxury).toBe('高級感')
    expect(p.axes.era).toBe('伝統的')
    expect(p.axes.brightness).toBe('落ち着いている')
  })

  it('ネット販売ありなら商品販売型、実店舗なら店舗型', () => {
    expect(
      fallbackSearchProfile({ industryLabel: 'x', hasEcommerce: true }).axes.model,
    ).toBe('商品販売型')
    expect(
      fallbackSearchProfile({ industryLabel: 'x', isStoreType: true }).axes.model,
    ).toBe('店舗型')
    expect(fallbackSearchProfile({ industryLabel: 'x' }).axes.model).toBe('サービス型')
  })

  it('トーン未入力でも壊れない', () => {
    const p = fallbackSearchProfile({ industryLabel: '製造業' })
    expect(p.industry).toBe('製造業')
    expect(p.impressions).toEqual([])
  })
})

describe('scoreReference', () => {
  it('業種一致が最も強く効く', () => {
    const match = makeRef({ industry: '飲食店' })
    const noMatch = makeRef({ industry: '製造業' })
    expect(scoreReference(baseProfile, match)).toBeGreaterThan(
      scoreReference(baseProfile, noMatch),
    )
  })

  it('タグ一致は本文一致より高く加点される', () => {
    const tagMatch = makeRef({ style_tags: ['和風'] })
    const textMatch = makeRef({ summary: '和風の落ち着いたサイト' })
    expect(scoreReference(baseProfile, tagMatch)).toBeGreaterThan(
      scoreReference(baseProfile, textMatch),
    )
  })

  it('回答（プロファイル）が違えばスコア順位が変わる', () => {
    const washoku = makeRef({ industry: '飲食店', style_tags: ['和風', '高級感'] })
    const pop = makeRef({ industry: '教室・スクール', style_tags: ['ポップ', '明るい'] })

    const popProfile: SearchProfile = {
      industry: '教室・スクール',
      purpose: '',
      target: '',
      impressions: ['明るい', 'ポップ'],
      axes: { brightness: '明るい' },
    }
    expect(scoreReference(baseProfile, washoku)).toBeGreaterThan(
      scoreReference(baseProfile, pop),
    )
    expect(scoreReference(popProfile, pop)).toBeGreaterThan(
      scoreReference(popProfile, washoku),
    )
  })

  it('analysisが欠けていても計算できる', () => {
    const ref = makeRef({ analysis: undefined as never })
    expect(() => scoreReference(baseProfile, ref)).not.toThrow()
  })
})

describe('selectDiverse', () => {
  it('スコア最上位は必ず選ばれる', () => {
    const refs = [10, 50, 30].map((score, i) => ({
      ref: makeRef({ id: `r${i}` }),
      score,
    }))
    expect(selectDiverse(refs, 3)[0].score).toBe(50)
  })

  it('タグが重複する高スコア候補より、毛色の違う候補を優先できる', () => {
    const a = { ref: makeRef({ id: 'a', style_tags: ['和風', '高級感', '伝統的'] }), score: 50 }
    const b = { ref: makeRef({ id: 'b', style_tags: ['和風', '高級感', '伝統的'] }), score: 48 }
    const c = { ref: makeRef({ id: 'c', style_tags: ['ミニマル', 'モダン'] }), score: 30 }
    const picked = selectDiverse([a, b, c], 2)
    expect(picked.map((p) => p.ref.id)).toEqual(['a', 'c'])
  })

  it('候補が3件未満ならある分だけ返す', () => {
    const one = [{ ref: makeRef({}), score: 10 }]
    expect(selectDiverse(one, 3)).toHaveLength(1)
    expect(selectDiverse([], 3)).toHaveLength(0)
  })
})

describe('fallbackDirectionName', () => {
  it('タグから初心者向けの名称を作る', () => {
    expect(fallbackDirectionName(['和風', 'シンプル'])).toBe('伝統と上品さを重視したデザイン')
    expect(fallbackDirectionName(['ミニマル'])).toBe('現代的ですっきりしたデザイン')
  })

  it('辞書にないタグは連結、タグなしは汎用名', () => {
    expect(fallbackDirectionName(['独特', '個性的'])).toBe('独特・個性的のデザイン')
    expect(fallbackDirectionName([])).toBe('おすすめのデザイン')
  })
})

describe('parseSearchProfile', () => {
  it('正しいJSONをパースし、不正な軸は捨てる', () => {
    const p = parseSearchProfile(
      JSON.stringify({
        industry: '飲食店',
        purpose: '集客',
        target: '家族連れ',
        impressions: ['和風'],
        axes: { era: '伝統的', luxury: 'とても高級' },
      }),
    )
    expect(p?.industry).toBe('飲食店')
    expect(p?.axes.era).toBe('伝統的')
    expect(p?.axes.luxury).toBeUndefined()
  })

  it('JSONでなければ null', () => {
    expect(parseSearchProfile('わかりません')).toBeNull()
  })
})

describe('parseCandidateLabels', () => {
  it('配列をパースする（余計な説明文つきでも可）', () => {
    const text =
      '候補はこちらです。\n[{"name":"伝統と上品さを重視","description":"説明","features":["a","b","c","d"]}]'
    const labels = parseCandidateLabels(text, 1)
    expect(labels?.[0].name).toBe('伝統と上品さを重視')
    expect(labels?.[0].features).toHaveLength(3)
  })

  it('数が足りない・nameがない場合は null', () => {
    expect(parseCandidateLabels('[{"name":"x"}]', 2)).toBeNull()
    expect(parseCandidateLabels('[{"description":"x"}]', 1)).toBeNull()
  })
})

describe('parseDesignBrief / briefToPromptText', () => {
  const valid = {
    concept: '和の温かみ',
    impression: '安心感',
    colorPalette: ['#1B4332（メイン）'],
    typography: '明朝体',
    firstView: '茶畑の写真',
    layoutSpacing: '余白広め',
    photoTextRatio: '写真6:文字4',
    sections: '1カラム',
    cta: '緑の大きいボタン',
    mobile: '縦積み',
    avoid: ['原色多用'],
  }

  it('正しいJSONをパースできる', () => {
    const brief = parseDesignBrief(JSON.stringify(valid))
    expect(brief?.concept).toBe('和の温かみ')
    expect(brief?.colorPalette).toHaveLength(1)
  })

  it('concept か colorPalette が欠けていれば null', () => {
    expect(parseDesignBrief(JSON.stringify({ ...valid, concept: '' }))).toBeNull()
    expect(parseDesignBrief(JSON.stringify({ ...valid, colorPalette: [] }))).toBeNull()
  })

  it('briefToPromptText に全項目が含まれる', () => {
    const brief = parseDesignBrief(JSON.stringify(valid))!
    const text = briefToPromptText(brief)
    for (const value of ['和の温かみ', '#1B4332', '明朝体', '茶畑の写真', '原色多用']) {
      expect(text).toContain(value)
    }
  })
})
