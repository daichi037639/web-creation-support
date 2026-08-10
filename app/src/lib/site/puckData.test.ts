import { describe, expect, it } from 'vitest'
import {
  imageRefToPuck,
  puckDataToSite,
  puckImageToRef,
  puckStyleToSection,
  siteToPuckData,
  styleToPuck,
} from '@/lib/site/puckData'
import { sanitizeImage } from '@/lib/site/schema'
import { TOKEN_PRESETS } from '@/lib/site/tokens'
import type { SiteData } from '@/types/site'

function makeSite(): SiteData {
  return {
    version: 1,
    brief: {
      siteName: 'テスト屋',
      tagline: 'タグライン',
      industry: '飲食店',
      audience: '',
      toneKeywords: [],
      keyMessages: [],
    },
    designTokens: TOKEN_PRESETS['shinise-warm'],
    assets: [{ id: 'asset-1', url: 'https://example.com/a.jpg', kind: 'product', caption: '商品' }],
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'ホーム',
        sections: [
          { id: 'home-s1', component: 'HeaderSimple', props: { siteName: 'テスト屋' } },
          {
            id: 'home-s2',
            component: 'HeroSplit',
            props: {
              title: '見出し',
              image: { type: 'material', id: 'asset-1' },
              imagePosition: 'right',
            },
            style: { spacing: 'loose' },
          },
          {
            id: 'home-s3',
            component: 'ProductGrid',
            props: {
              title: '商品',
              items: [
                {
                  name: 'A',
                  image: { type: 'placeholder', aspectRatio: '1/1', intent: '商品写真' },
                },
              ],
            },
          },
          { id: 'home-s4', component: 'FooterSimple', props: { siteName: 'テスト屋' } },
        ],
      },
    ],
  }
}

describe('画像参照 ⇔ Puck', () => {
  it('material / placeholder / url を往復できる', () => {
    const assetIds = new Set(['asset-1'])
    const cases = [
      { type: 'material', id: 'asset-1' },
      { type: 'placeholder', aspectRatio: '1/1', intent: '写真' },
      { type: 'url', url: 'https://example.com/x.jpg' },
    ]
    for (const ref of cases) {
      const roundTripped = sanitizeImage(puckImageToRef(imageRefToPuck(ref)), assetIds)
      expect(roundTripped).toEqual(ref)
    }
  })
})

describe('style ⇔ Puck', () => {
  it('未指定キーは空文字、往復で復元される', () => {
    const puckValue = styleToPuck({ spacing: 'loose' })
    expect(puckValue.spacing).toBe('loose')
    expect(puckValue.background).toBe('')
    expect(puckStyleToSection(puckValue)).toEqual({ spacing: 'loose' })
    expect(puckStyleToSection(styleToPuck(undefined))).toBeUndefined()
  })
})

describe('SiteData ⇔ Puck Data round-trip', () => {
  it('無編集の変換往復でセクション構成・ID・propsが保たれる', () => {
    const site = makeSite()
    const data = siteToPuckData(site, 'home')
    expect(data.content).toHaveLength(4)
    expect(data.content[1].props.id).toBe('home-s2')

    const back = puckDataToSite(site, 'home', data)
    const sections = back.pages[0].sections
    expect(sections.map((s) => s.id)).toEqual(['home-s1', 'home-s2', 'home-s3', 'home-s4'])
    expect(sections[1].props.title).toBe('見出し')
    expect(sections[1].props.image).toEqual({ type: 'material', id: 'asset-1' })
    expect(sections[1].style).toEqual({ spacing: 'loose' })
    expect((sections[2].props.items as unknown[])).toHaveLength(1)
  })

  it('ヘッダー・フッターが削除されても復元し、位置を保証する', () => {
    const site = makeSite()
    const data = siteToPuckData(site, 'home')
    data.content = data.content.filter(
      (c) => c.type !== 'HeaderSimple' && c.type !== 'FooterSimple',
    )
    // フッターを途中に紛れ込ませても末尾へ寄せられる
    const back = puckDataToSite(site, 'home', data)
    const sections = back.pages[0].sections
    expect(sections[0].component).toBe('HeaderSimple')
    expect(sections[sections.length - 1].component).toBe('FooterSimple')
  })

  it('IDのない新規セクションにも一意なIDを払い出す', () => {
    const site = makeSite()
    const data = siteToPuckData(site, 'home')
    data.content.splice(2, 0, {
      type: 'FaqSimple',
      props: {
        id: '',
        title: 'FAQ',
        items: [{ question: 'Q', answer: 'A' }],
        style: styleToPuck(undefined),
      },
    })
    const back = puckDataToSite(site, 'home', data)
    const ids = back.pages[0].sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(back.pages[0].sections.some((s) => s.component === 'FaqSimple')).toBe(true)
  })

  it('未知コンポーネントは無視される', () => {
    const site = makeSite()
    const data = siteToPuckData(site, 'home')
    data.content.push({ type: 'EvilComponent', props: { id: 'x' } })
    const back = puckDataToSite(site, 'home', data)
    expect(back.pages[0].sections.some((s) => s.component === 'EvilComponent')).toBe(false)
  })
})

describe('neutralPuckProps', () => {
  it('架空のサンプル文（カタログ defaults）を含まない', async () => {
    const { neutralPuckProps } = await import('@/lib/site/puckData')
    const { COMPONENT_CATALOG } = await import('@/lib/site/catalog')
    const banned = ['喜多の園', 'ふる川', 'さくら司法書士', '桐生', 'ひもかわ']
    for (const def of COMPONENT_CATALOG) {
      const text = JSON.stringify(neutralPuckProps(def))
      for (const word of banned) {
        expect(text, `${def.component} に「${word}」`).not.toContain(word)
      }
      // 全フィールドキーが定義されている（Puck のフィールドが制御された状態になる）
      for (const key of Object.keys(def.fields)) {
        expect(JSON.parse(text)[key], `${def.component}.${key}`).toBeDefined()
      }
    }
  })
})
