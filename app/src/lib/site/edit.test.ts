import { describe, expect, it } from 'vitest'
import { applyEditOperation, buildEditToolSchema, buildEditContext } from '@/lib/site/edit'
import { TOKEN_PRESETS } from '@/lib/site/tokens'
import type { SiteData } from '@/types/site'

function makeSite(): SiteData {
  return {
    version: 1,
    brief: {
      siteName: 'テスト屋',
      tagline: 'タグライン',
      industry: '飲食店',
      audience: 'テスト',
      toneKeywords: ['落ち着いた'],
      keyMessages: [],
    },
    designTokens: TOKEN_PRESETS['washoku-dark'],
    assets: [{ id: 'asset-1', url: 'https://example.com/a.jpg', kind: 'product', caption: '商品' }],
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'ホーム',
        sections: [
          { id: 'home-s1', component: 'HeaderSimple', props: { siteName: 'テスト屋' } },
          { id: 'home-s2', component: 'HeroMinimal', props: { title: '元の見出し', description: '説明' } },
          {
            id: 'home-s3',
            component: 'MenuList',
            props: { title: 'メニュー', items: [{ name: 'A定食', price: '900円' }] },
          },
          { id: 'home-s4', component: 'FooterSimple', props: { siteName: 'テスト屋' } },
        ],
      },
    ],
  }
}

describe('applyEditOperation', () => {
  it('patch_content が対象セクションだけを変更する', () => {
    const site = makeSite()
    const result = applyEditOperation(site, {
      operation: 'patch_content',
      explanation: '見出しを短くしました',
      sectionId: 'home-s2',
      props: { title: '短い見出し', description: '説明' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const hero = result.site.pages[0].sections[1]
    expect(hero.props.title).toBe('短い見出し')
    expect(hero.id).toBe('home-s2') // stable ID 維持
    // 他セクションは参照ごと不変
    expect(result.site.pages[0].sections[2]).toBe(site.pages[0].sections[2])
  })

  it('patch_content は未知 props を捨て、素材IDを検証する', () => {
    const result = applyEditOperation(makeSite(), {
      operation: 'patch_content',
      explanation: 'x',
      sectionId: 'home-s2',
      props: { title: 'T', evil: 'x' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.site.pages[0].sections[1].props.evil).toBeUndefined()
  })

  it('patch_style は既存 style にマージする', () => {
    const site = makeSite()
    site.pages[0].sections[1].style = { spacing: 'loose' }
    const result = applyEditOperation(site, {
      operation: 'patch_style',
      explanation: 'x',
      sectionId: 'home-s2',
      style: { background: 'tint', bogus: 'x' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.site.pages[0].sections[1].style).toEqual({
      spacing: 'loose',
      background: 'tint',
    })
  })

  it('set_tokens は現在のトークンを土台に部分変更する', () => {
    const result = applyEditOperation(makeSite(), {
      operation: 'set_tokens',
      explanation: 'x',
      tokens: { colors: { primary: '#ff0000' }, headingFont: 'yuji-syuku' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.site.designTokens.colors.primary).toBe('#ff0000')
    expect(result.site.designTokens.typography.headingFont).toBe('yuji-syuku')
    // 未指定の項目は元のまま（washoku-dark の背景）
    expect(result.site.designTokens.colors.background).toBe(
      TOKEN_PRESETS['washoku-dark'].colors.background,
    )
  })

  it('replace_component は内容を引き継いで載せ替える', () => {
    const result = applyEditOperation(makeSite(), {
      operation: 'replace_component',
      explanation: 'x',
      sectionId: 'home-s2',
      component: 'HeroCentered',
      props: { title: '元の見出し', description: '説明' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const section = result.site.pages[0].sections[1]
    expect(section.component).toBe('HeroCentered')
    expect(section.id).toBe('home-s2')
  })

  it('reorder_sections は完全な並びのみ受け付け、ヘッダー・フッター位置を守る', () => {
    const site = makeSite()
    const ok = applyEditOperation(site, {
      operation: 'reorder_sections',
      explanation: 'x',
      pageSlug: 'home',
      order: ['home-s1', 'home-s3', 'home-s2', 'home-s4'],
    })
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      expect(ok.site.pages[0].sections.map((s) => s.id)).toEqual([
        'home-s1', 'home-s3', 'home-s2', 'home-s4',
      ])
    }

    const missing = applyEditOperation(site, {
      operation: 'reorder_sections',
      explanation: 'x',
      pageSlug: 'home',
      order: ['home-s1', 'home-s2', 'home-s4'],
    })
    expect(missing.ok).toBe(false)

    const headerMoved = applyEditOperation(site, {
      operation: 'reorder_sections',
      explanation: 'x',
      pageSlug: 'home',
      order: ['home-s2', 'home-s1', 'home-s3', 'home-s4'],
    })
    expect(headerMoved.ok).toBe(false)
  })

  it('add_section はフッター直前に一意なIDで追加する', () => {
    const result = applyEditOperation(makeSite(), {
      operation: 'add_section',
      explanation: 'x',
      pageSlug: 'home',
      component: 'FaqSimple',
      props: {
        title: 'よくある質問',
        items: [{ question: 'Q', answer: 'A' }],
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const sections = result.site.pages[0].sections
    expect(sections).toHaveLength(5)
    expect(sections[3].component).toBe('FaqSimple')
    expect(sections[4].component).toBe('FooterSimple')
    expect(new Set(sections.map((s) => s.id)).size).toBe(5)
  })

  it('ヘッダーの追加・削除は拒否する', () => {
    expect(
      applyEditOperation(makeSite(), {
        operation: 'add_section',
        explanation: 'x',
        component: 'HeaderSimple',
        props: { siteName: 'x' },
      }).ok,
    ).toBe(false)
    expect(
      applyEditOperation(makeSite(), {
        operation: 'remove_section',
        explanation: 'x',
        sectionId: 'home-s1',
      }).ok,
    ).toBe(false)
  })

  it('remove_section が通常セクションを削除する', () => {
    const result = applyEditOperation(makeSite(), {
      operation: 'remove_section',
      explanation: 'x',
      sectionId: 'home-s3',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.site.pages[0].sections.map((s) => s.id)).toEqual([
      'home-s1', 'home-s2', 'home-s4',
    ])
  })

  it('none は explanation をエラーとして返す（適用なし）', () => {
    const result = applyEditOperation(makeSite(), {
      operation: 'none',
      explanation: 'その操作はできません',
    })
    expect(result).toEqual({ ok: false, error: 'その操作はできません' })
  })

  it('存在しない sectionId はエラー', () => {
    expect(
      applyEditOperation(makeSite(), {
        operation: 'patch_content',
        explanation: 'x',
        sectionId: 'nope',
        props: {},
      }).ok,
    ).toBe(false)
  })
})

describe('編集用 schema / コンテキスト', () => {
  it('schema に7操作+noneが含まれる', () => {
    const schema = buildEditToolSchema() as never as {
      properties: { operation: { enum: string[] } }
      required: string[]
    }
    expect(schema.properties.operation.enum).toHaveLength(8)
    expect(schema.required).toEqual(['operation', 'explanation'])
  })

  it('コンテキストに構成・選択中セクション・素材が含まれる', () => {
    const text = buildEditContext(makeSite(), '見出しを短く', 'home-s2')
    expect(text).toContain('home-s2')
    expect(text).toContain('選択中のセクション')
    expect(text).toContain('元の見出し')
    expect(text).toContain('asset-1')
    expect(text).toContain('見出しを短く')
  })
})
