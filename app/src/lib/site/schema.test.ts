import { describe, expect, it } from 'vitest'
import {
  buildSiteContentToolSchema,
  buildSiteDesignToolSchema,
  buildTokensFromDesign,
  sanitizeBrief,
  sanitizeHref,
  sanitizeImage,
  sanitizeProps,
  sanitizeSectionStyle,
  validateSiteContent,
} from '@/lib/site/schema'
import { CATALOG_BY_NAME, COMPONENT_CATALOG } from '@/lib/site/catalog'
import { SITE_COMPONENTS } from '@/components/site'
import {
  BODY_FONT_IDS,
  resolveFonts,
  rootDecorAttrs,
  sectionWrapperProps,
  SITE_FONTS,
  TOKEN_PRESETS,
  tokensToCssVars,
} from '@/lib/site/tokens'
import { SAMPLE_SITES } from '@/lib/site/sampleSites'
import type { SiteBrief } from '@/types/site'

const BRIEF: SiteBrief = {
  siteName: 'テスト屋',
  tagline: 'テストのタグライン',
  industry: '小売',
  audience: 'テスト',
  toneKeywords: [],
  keyMessages: [],
}

const TOKENS = TOKEN_PRESETS['trust-blue']

describe('catalog とコンポーネント実装の整合', () => {
  it('カタログの全コンポーネントに React 実装がある', () => {
    for (const def of COMPONENT_CATALOG) {
      expect(SITE_COMPONENTS[def.component], def.component).toBeDefined()
    }
  })

  it('defaults が自分自身の schema を通る（required が欠けない）', () => {
    for (const def of COMPONENT_CATALOG) {
      const cleaned = sanitizeProps(def, def.defaults, new Set())
      expect(cleaned, def.component).not.toBeNull()
      for (const [key, spec] of Object.entries(def.fields)) {
        if (spec.required) {
          expect(cleaned![key], `${def.component}.${key}`).toBeDefined()
        }
      }
    }
  })
})

describe('sanitizeHref', () => {
  it('危険な形式は # に落とす', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBe('#')
    expect(sanitizeHref('data:text/html,x')).toBe('#')
  })
  it('許可された形式は通す', () => {
    expect(sanitizeHref('/products')).toBe('/products')
    expect(sanitizeHref('#contact')).toBe('#contact')
    expect(sanitizeHref('tel:0277-00-0000')).toBe('tel:0277-00-0000')
    expect(sanitizeHref('mailto:a@b.c')).toBe('mailto:a@b.c')
    expect(sanitizeHref('https://example.com')).toBe('https://example.com')
  })
})

describe('sanitizeImage', () => {
  it('実在する素材IDは material 参照になる', () => {
    const ref = sanitizeImage({ source: 'material', materialId: 'abc' }, new Set(['abc']))
    expect(ref).toEqual({ type: 'material', id: 'abc' })
  })
  it('存在しない素材IDは placeholder に落ちる', () => {
    const ref = sanitizeImage({ source: 'material', materialId: 'zzz' }, new Set(['abc']))
    expect(ref?.type).toBe('placeholder')
  })
  it('不正な aspectRatio は 4/3 に丸める', () => {
    const ref = sanitizeImage({ source: 'placeholder', aspectRatio: '9/1', intent: 'x' }, new Set())
    expect(ref).toEqual({ type: 'placeholder', aspectRatio: '4/3', intent: 'x' })
  })
})

describe('sanitizeProps', () => {
  const hero = CATALOG_BY_NAME['HeroSplit']

  it('未知の props を捨てる', () => {
    const out = sanitizeProps(hero, { title: 'T', evil: 'x' }, new Set())
    expect(out!.evil).toBeUndefined()
    expect(out!.title).toBe('T')
  })

  it('必須スカラー欠落は中立値で補う（架空のサンプル文を混入させない）', () => {
    const out = sanitizeProps(hero, {}, new Set())
    expect(out).not.toBeNull()
    expect(out!.title).toBe('（あとで入力）')
    expect(out!.title).not.toBe(hero.defaults.title)
    expect(out!.image).toEqual({
      type: 'placeholder',
      aspectRatio: '4/3',
      intent: '事業の雰囲気が伝わる写真',
    })
  })

  it('必須の items が空なら null（セクション除外）', () => {
    const grid = CATALOG_BY_NAME['ProductGrid']
    expect(sanitizeProps(grid, { title: 'T' }, new Set())).toBeNull()
    expect(sanitizeProps(grid, { title: 'T', items: [{}] }, new Set())).toBeNull()
  })

  it('validateSiteContent は items 空のセクションを除外して issue を残す', () => {
    const { site, issues } = validateSiteContent(
      {
        pages: [
          {
            slug: 'home',
            title: 'ホーム',
            sections: [
              { component: 'HeroMinimal', props: { title: 'T' } },
              { component: 'FeatureCards', props: { title: '強み' } }, // items なし
            ],
          },
        ],
      },
      BRIEF,
      TOKENS,
      [],
    )
    expect(site.pages[0].sections.some((s) => s.component === 'FeatureCards')).toBe(false)
    expect(issues.some((i) => i.message.includes('FeatureCards'))).toBe(true)
  })

  it('items の壊れた要素を除外し、max を超えたら切り詰める', () => {
    const grid = CATALOG_BY_NAME['ProductGrid']
    const items = [
      { name: 'A', image: { source: 'placeholder', intent: 'x' } },
      { image: { source: 'placeholder', intent: 'x' } }, // name 必須欠落 → 除外
      ...Array.from({ length: 10 }, (_, i) => ({
        name: `B${i}`,
        image: { source: 'placeholder', intent: 'x' },
      })),
    ]
    const out = sanitizeProps(grid, { title: 'T', items }, new Set())
    const cleaned = out!.items as unknown[]
    expect(cleaned.length).toBeLessThanOrEqual(6)
    expect((cleaned[0] as { name: string }).name).toBe('A')
  })
})

describe('validateSiteContent', () => {
  it('ヘッダー・フッターが無いページには自動追加する', () => {
    const { site } = validateSiteContent(
      { pages: [{ slug: 'home', title: 'ホーム', sections: [{ component: 'HeroMinimal', props: { title: 'T' } }] }] },
      BRIEF,
      TOKENS,
      [],
    )
    const cats = site.pages[0].sections.map((s) => CATALOG_BY_NAME[s.component].category)
    expect(cats[0]).toBe('header')
    expect(cats[cats.length - 1]).toBe('footer')
  })

  it('未知のコンポーネントを除外して issue を残す', () => {
    const { site, issues } = validateSiteContent(
      {
        pages: [
          {
            slug: 'home',
            title: 'ホーム',
            sections: [{ component: 'FancyUnknownHero', props: {} }],
          },
        ],
      },
      BRIEF,
      TOKENS,
      [],
    )
    expect(site.pages[0].sections.some((s) => s.component === 'FancyUnknownHero')).toBe(false)
    expect(issues.some((i) => i.message.includes('FancyUnknownHero'))).toBe(true)
  })

  it('全セクションに stable ID が付く・最初のページは home になる', () => {
    const { site } = validateSiteContent(
      {
        pages: [
          { slug: 'ショップ', title: 'ショップ', sections: [{ component: 'HeroMinimal', props: { title: 'T' } }] },
        ],
      },
      BRIEF,
      TOKENS,
      [],
    )
    expect(site.pages[0].slug).toBe('home')
    const ids = site.pages.flatMap((p) => p.sections.map((s) => s.id))
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toBeTruthy())
  })

  it('ページゼロでも最小構成のサイトを返す', () => {
    const { site } = validateSiteContent({}, BRIEF, TOKENS, [])
    expect(site.pages.length).toBe(1)
    expect(site.pages[0].sections.length).toBeGreaterThanOrEqual(3)
  })
})

describe('sanitizeSectionStyle（LOG-013 Layer 1）', () => {
  it('有効な値だけを残す', () => {
    const style = sanitizeSectionStyle({
      background: 'tint',
      spacing: 'loose',
      headingScale: 'xl',
      align: 'middle', // 不正 → 捨てる
      evil: 'x', // 未知キー → 捨てる
    })
    expect(style).toEqual({ background: 'tint', spacing: 'loose', headingScale: 'xl' })
  })

  it('全て不正なら undefined', () => {
    expect(sanitizeSectionStyle({ background: 'neon' })).toBeUndefined()
    expect(sanitizeSectionStyle('text')).toBeUndefined()
    expect(sanitizeSectionStyle(null)).toBeUndefined()
  })

  it('validateSiteContent がセクションの style を保持する', () => {
    const { site } = validateSiteContent(
      {
        pages: [
          {
            slug: 'home',
            title: 'ホーム',
            sections: [
              {
                component: 'HeroMinimal',
                props: { title: 'T' },
                style: { spacing: 'loose', background: 'bad-value' },
              },
            ],
          },
        ],
      },
      BRIEF,
      TOKENS,
      [],
    )
    const hero = site.pages[0].sections.find((s) => s.component === 'HeroMinimal')
    expect(hero?.style).toEqual({ spacing: 'loose' })
  })
})

describe('sectionWrapperProps / rootDecorAttrs', () => {
  it('style を data 属性と CSS 変数へ変換する', () => {
    const { attrs, vars } = sectionWrapperProps(
      { background: 'surface', spacing: 'tight', containerWidth: 'narrow', headingScale: 'lg' },
      TOKEN_PRESETS['trust-blue'],
    )
    expect(attrs['data-sbg']).toBe('surface')
    expect(attrs['data-hscale']).toBe('lg')
    expect(vars['--s-section-y']).toContain('clamp')
    expect(vars['--s-container']).toBe('58rem')
  })

  it('motion は inherit で token の値に従う', () => {
    const rise = sectionWrapperProps(undefined, TOKEN_PRESETS['shinise-warm'])
    expect(rise.attrs['data-motion']).toBe('rise')
    const none = sectionWrapperProps({ motion: 'none' }, TOKEN_PRESETS['shinise-warm'])
    expect(none.attrs['data-motion']).toBeUndefined()
    const off = sectionWrapperProps(undefined, TOKEN_PRESETS['trust-blue'])
    expect(off.attrs['data-motion']).toBeUndefined()
  })

  it('decor がルート data 属性になる', () => {
    const attrs = rootDecorAttrs(TOKEN_PRESETS['shinise-warm'])
    expect(attrs['data-ha']).toBe('rule')
    expect(attrs['data-imgt']).toBe('frame')
  })
})

describe('buildTokensFromDesign', () => {
  it('preset に色の上書きをマージする', () => {
    const tokens = buildTokensFromDesign({
      preset: 'shinise-warm',
      colors: { primary: '#123456', background: 'red' /* 不正 → 無視 */ },
    })
    expect(tokens.colors.primary).toBe('#123456')
    expect(tokens.colors.background).toBe(TOKEN_PRESETS['shinise-warm'].colors.background)
  })

  it('decor の上書きをマージし、不正値は preset に従う', () => {
    const tokens = buildTokensFromDesign({
      preset: 'trust-blue',
      headingAccent: 'underline',
      imageTreatment: 'sparkle', // 不正 → preset
      motion: 'rise',
    })
    expect(tokens.decor.headingAccent).toBe('underline')
    expect(tokens.decor.imageTreatment).toBe(TOKEN_PRESETS['trust-blue'].decor.imageTreatment)
    expect(tokens.decor.motion).toBe('rise')
  })

  it('不正な preset は trust-blue に落ちる', () => {
    const tokens = buildTokensFromDesign({ preset: 'nope' })
    expect(tokens.colors.primary).toBe(TOKEN_PRESETS['trust-blue'].colors.primary)
  })
})

describe('フォント（LOG-014）', () => {
  it('旧 fontPairing 形式を新フォントIDへ変換できる', () => {
    const fonts = resolveFonts({
      fontPairing: 'mincho-elegant',
      headingLetterSpacing: 'wide',
      headingWeight: 600,
    } as never)
    expect(fonts.headingId).toBe('shippori-mincho')
    expect(fonts.bodyId).toBe('noto-sans')
  })

  it('不明なフォントIDは noto-sans に落ちる', () => {
    const fonts = resolveFonts({ headingFont: 'comic-sans', bodyFont: 'papyrus' } as never)
    expect(fonts.headingId).toBe('noto-sans')
    expect(fonts.bodyId).toBe('noto-sans')
  })

  it('本文フォントは可読性フラグ付きのみ', () => {
    expect(BODY_FONT_IDS).not.toContain('yuji-syuku')
    expect(BODY_FONT_IDS).toContain('noto-sans')
    for (const id of BODY_FONT_IDS) expect(SITE_FONTS[id].body).toBe(true)
  })

  it('buildTokensFromDesign がフォント上書きを受け、本文は可読フォントに制限する', () => {
    const tokens = buildTokensFromDesign({
      preset: 'shinise-warm',
      headingFont: 'yuji-syuku',
      bodyFont: 'yuji-syuku', // 本文には不可 → preset の本文フォントへ
    })
    expect(tokens.typography.headingFont).toBe('yuji-syuku')
    expect(tokens.typography.bodyFont).toBe(
      TOKEN_PRESETS['shinise-warm'].typography.bodyFont,
    )
  })
})

describe('tokensToCssVars', () => {
  it('全 preset が CSS 変数に変換できる', () => {
    for (const tokens of Object.values(TOKEN_PRESETS)) {
      const vars = tokensToCssVars(tokens)
      expect(vars['--s-primary']).toMatch(/^#/)
      expect(vars['--s-heading-font']).toBeTruthy()
      expect(vars['--s-section-y']).toContain('clamp')
    }
  })
})

describe('sanitizeBrief', () => {
  it('欠損時は fallback 名を使う', () => {
    const brief = sanitizeBrief(null, 'フォールバック')
    expect(brief.siteName).toBe('フォールバック')
  })
})

describe('JSON Schema 生成', () => {
  it('content schema に全コンポーネントが含まれる', () => {
    const schema = buildSiteContentToolSchema() as never as {
      properties: { pages: { items: { properties: { sections: { items: { anyOf: unknown[] } } } } } }
    }
    expect(schema.properties.pages.items.properties.sections.items.anyOf.length).toBe(
      COMPONENT_CATALOG.length,
    )
  })
  it('design schema の preset enum が TOKEN_PRESETS と一致する', () => {
    const schema = buildSiteDesignToolSchema() as never as {
      properties: { design: { properties: { preset: { enum: string[] } } } }
    }
    expect(schema.properties.design.properties.preset.enum.sort()).toEqual(
      Object.keys(TOKEN_PRESETS).sort(),
    )
  })
})

describe('サンプルサイト', () => {
  it('全サンプルの全セクションが実在コンポーネントを使っている', () => {
    for (const { site } of Object.values(SAMPLE_SITES)) {
      for (const page of site.pages) {
        for (const section of page.sections) {
          expect(CATALOG_BY_NAME[section.component], section.component).toBeDefined()
          expect(SITE_COMPONENTS[section.component], section.component).toBeDefined()
        }
      }
    }
  })
})
