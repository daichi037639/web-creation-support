import { describe, it, expect } from 'vitest'
import type { MaterialImage } from '@/types/wizard'
import {
  buildMaterialsPromptText,
  materialKindLabel,
  canAddMaterials,
  MAX_MATERIALS,
} from './materials'

function makeMaterial(overrides: Partial<MaterialImage>): MaterialImage {
  return {
    id: 'id-1',
    url: 'https://example.supabase.co/storage/v1/object/public/materials/s/1.jpg',
    kind: 'product',
    caption: '抹茶パッケージの写真',
    ...overrides,
  }
}

describe('buildMaterialsPromptText', () => {
  it('素材ゼロなら空文字（従来の生成コンテキストを変えない）', () => {
    expect(buildMaterialsPromptText([])).toBe('')
  })

  it('1件を [種類] キャプション: URL の形式で出力する', () => {
    const text = buildMaterialsPromptText([makeMaterial({})])
    expect(text).toContain('用意された実際の写真素材:')
    expect(text).toContain(
      '- [商品] 抹茶パッケージの写真: https://example.supabase.co/storage/v1/object/public/materials/s/1.jpg',
    )
  })

  it('複数件は入力順を保つ', () => {
    const text = buildMaterialsPromptText([
      makeMaterial({ kind: 'exterior', caption: '店舗の外観' }),
      makeMaterial({ kind: 'logo', caption: 'ロゴマーク', url: 'https://example.com/2.jpg' }),
    ])
    const exteriorIndex = text.indexOf('[外観]')
    const logoIndex = text.indexOf('[ロゴ]')
    expect(exteriorIndex).toBeGreaterThan(-1)
    expect(logoIndex).toBeGreaterThan(exteriorIndex)
  })

  it('キャプションが空・空白のみなら「写真」で補う', () => {
    expect(buildMaterialsPromptText([makeMaterial({ caption: '' })])).toContain('- [商品] 写真:')
    expect(buildMaterialsPromptText([makeMaterial({ caption: '  ' })])).toContain('- [商品] 写真:')
  })
})

describe('materialKindLabel', () => {
  it('定義済みの種類はラベルに変換する', () => {
    expect(materialKindLabel('interior')).toBe('店内')
    expect(materialKindLabel('people')).toBe('人物')
  })

  it('未知の値は「その他」へフォールバックする', () => {
    expect(materialKindLabel('unknown-kind')).toBe('その他')
    expect(materialKindLabel('')).toBe('その他')
  })
})

describe('canAddMaterials', () => {
  it('上限ちょうどまでは追加できる', () => {
    expect(canAddMaterials(0, MAX_MATERIALS)).toBe(true)
    expect(canAddMaterials(MAX_MATERIALS - 1, 1)).toBe(true)
  })

  it('上限を超える追加はできない', () => {
    expect(canAddMaterials(MAX_MATERIALS, 1)).toBe(false)
    expect(canAddMaterials(MAX_MATERIALS - 1, 2)).toBe(false)
  })
})
