// カタログ（catalog.ts）から AI 向け JSON Schema と、AI出力の validation /
// fallback を導出する。AI の structured output は信用せず、必ずここを通してから
// Renderer に渡す。すべて pure 関数（unit test 対象）

import {
  CATALOG_BY_NAME,
  COMPONENT_CATALOG,
  type ComponentDef,
  type FieldSpec,
  type ScalarFieldSpec,
} from '@/lib/site/catalog'
import {
  BODY_FONT_IDS,
  SITE_FONT_IDS,
  SITE_FONTS,
  TOKEN_PRESETS,
  type TokenPresetId,
} from '@/lib/site/tokens'
import type {
  AssetReference,
  CtaLink,
  DesignTokens,
  SectionStyle,
  SiteAsset,
  SiteBrief,
  SiteData,
  SitePage,
  SiteSection,
} from '@/types/site'

// ────────────────────────────────────────────── JSON Schema 生成

type Json = Record<string, unknown>

const ASPECT_RATIOS = ['1/1', '4/3', '3/2', '16/9', '3/4']

const IMAGE_SCHEMA: Json = {
  type: 'object',
  description:
    '画像。アップロード済み素材を使う場合は {source:"material", materialId}、無い場合は {source:"placeholder", aspectRatio, intent} で「入れるべき写真の内容」を必ず日本語で書く',
  properties: {
    source: { type: 'string', enum: ['material', 'placeholder'] },
    materialId: { type: 'string', description: 'source=material のとき必須。素材一覧のID' },
    aspectRatio: { type: 'string', enum: ASPECT_RATIOS },
    intent: { type: 'string', description: 'source=placeholder のとき必須。推奨する写真の内容' },
  },
  required: ['source'],
}

const CTA_SCHEMA: Json = {
  type: 'object',
  description:
    'ボタン・リンク。href は "/スラッグ"（他ページ）、"#セクションID"、"tel:番号"、"mailto:アドレス"、外部URL のいずれか',
  properties: {
    label: { type: 'string' },
    href: { type: 'string' },
  },
  required: ['label', 'href'],
}

function scalarToJsonSchema(spec: ScalarFieldSpec): Json {
  switch (spec.kind) {
    case 'string':
    case 'text':
      return { type: 'string', description: spec.desc }
    case 'enum':
      return { type: 'string', enum: spec.values, description: spec.desc }
    case 'image':
      return { ...IMAGE_SCHEMA, description: `${spec.desc}。${IMAGE_SCHEMA.description}` }
    case 'cta':
      return { ...CTA_SCHEMA, description: `${spec.desc}。${CTA_SCHEMA.description}` }
  }
}

function fieldToJsonSchema(spec: FieldSpec): Json {
  if (spec.kind === 'items') {
    const props: Json = {}
    const required: string[] = []
    for (const [key, item] of Object.entries(spec.item)) {
      props[key] = scalarToJsonSchema(item)
      if (item.required) required.push(key)
    }
    return {
      type: 'array',
      description: spec.desc,
      maxItems: spec.max,
      items: { type: 'object', properties: props, required },
    }
  }
  return scalarToJsonSchema(spec)
}

/** SectionStyle（LOG-013 Layer 1）の許容値。schema と validation の単一情報源 */
export const SECTION_STYLE_VALUES = {
  background: ['default', 'surface', 'primary', 'tint'],
  spacing: ['tight', 'normal', 'loose'],
  align: ['left', 'center'],
  containerWidth: ['narrow', 'normal', 'wide'],
  headingScale: ['md', 'lg', 'xl'],
  imageRatio: ['1/1', '4/3', '3/2', '16/9', '3/4'],
  divider: ['none', 'top', 'bottom'],
  motion: ['inherit', 'none', 'rise'],
} as const satisfies Record<keyof SectionStyle, readonly string[]>

const SECTION_STYLE_SCHEMA: Json = {
  type: 'object',
  description:
    'セクション単位のスタイル上書き（任意）。ページ全体が単調にならないよう、背景・余白・見出しサイズに変化をつけるために使う。指定しなければコンポーネントの既定デザイン',
  properties: {
    background: {
      type: 'string',
      enum: [...SECTION_STYLE_VALUES.background],
      description: 'tint はメインカラーの薄敷き。primary は強い主張の帯（多用しない）',
    },
    spacing: { type: 'string', enum: [...SECTION_STYLE_VALUES.spacing], description: '上下余白' },
    align: { type: 'string', enum: [...SECTION_STYLE_VALUES.align], description: '見出しの揃え' },
    containerWidth: { type: 'string', enum: [...SECTION_STYLE_VALUES.containerWidth] },
    headingScale: {
      type: 'string',
      enum: [...SECTION_STYLE_VALUES.headingScale],
      description: '見出しの大きさ。ページ内で1〜2箇所だけ lg/xl にすると強弱が出る',
    },
    imageRatio: { type: 'string', enum: [...SECTION_STYLE_VALUES.imageRatio], description: 'セクション内の画像の縦横比を揃えて上書き' },
    divider: { type: 'string', enum: [...SECTION_STYLE_VALUES.divider], description: '罫線の区切り' },
    motion: { type: 'string', enum: [...SECTION_STYLE_VALUES.motion], description: 'スクロール入場の上書き' },
  },
}

/** AI出力の style を検証する。不正値は黙って捨てる（既定デザインに戻るだけで壊れない） */
export function sanitizeSectionStyle(raw: unknown): SectionStyle | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const input = raw as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const [key, allowed] of Object.entries(SECTION_STYLE_VALUES)) {
    const v = input[key]
    if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) out[key] = v
  }
  return Object.keys(out).length > 0 ? (out as SectionStyle) : undefined
}

function componentToJsonSchema(def: ComponentDef): Json {
  const props: Json = {}
  const required: string[] = []
  for (const [key, spec] of Object.entries(def.fields)) {
    props[key] = fieldToJsonSchema(spec)
    if (spec.required) required.push(key)
  }
  return {
    type: 'object',
    description: def.use,
    properties: {
      component: { type: 'string', const: def.component },
      props: { type: 'object', properties: props, required },
      style: SECTION_STYLE_SCHEMA,
    },
    required: ['component', 'props'],
  }
}

/** サイト本体（ページ・セクション構成）を返させるツールの input schema */
export function buildSiteContentToolSchema(): Json {
  return {
    type: 'object',
    properties: {
      pages: {
        type: 'array',
        maxItems: 5,
        description: 'サイトのページ。最初の1ページは必ず slug "home" のトップページにする',
        items: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              pattern: '^[a-z0-9-]+$',
              description: '英小文字のスラッグ（例：home, products, about, access）',
            },
            title: { type: 'string', description: 'ページ名（ナビゲーションに表示。例：商品紹介）' },
            sections: {
              type: 'array',
              maxItems: 12,
              description:
                'ページを構成するセクション。必ずヘッダーで始まりフッターで終わる',
              items: { anyOf: COMPONENT_CATALOG.map(componentToJsonSchema) },
            },
          },
          required: ['slug', 'title', 'sections'],
        },
      },
    },
    required: ['pages'],
  }
}

/** デザイン（brief + tokens）を返させるツールの input schema */
export function buildSiteDesignToolSchema(): Json {
  const hex = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }
  return {
    type: 'object',
    properties: {
      brief: {
        type: 'object',
        properties: {
          siteName: { type: 'string', description: 'サイト名・屋号' },
          tagline: { type: 'string', description: 'サイトを一言で表すコピー' },
          industry: { type: 'string', description: '業種' },
          audience: { type: 'string', description: '主なターゲット' },
          toneKeywords: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 5,
            description: 'デザインの方向性を表すキーワード（例：老舗らしい、上品、温かい）',
          },
          keyMessages: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 3,
            description: 'サイト全体で伝えるべきメッセージ',
          },
        },
        required: ['siteName', 'tagline', 'industry', 'audience', 'toneKeywords', 'keyMessages'],
      },
      design: {
        type: 'object',
        description: 'preset を土台に、必要な項目だけ上書きする',
        properties: {
          preset: {
            type: 'string',
            enum: Object.keys(TOKEN_PRESETS),
            description:
              '土台にする配色・書体の組み合わせ。shinise-warm=老舗・和・工芸 / washoku-dark=飲食・夜・旅館 / craft-natural=食品生産・農園 / trust-blue=士業・製造・信頼 / salon-soft=美容・教室',
          },
          colors: {
            type: 'object',
            description: '上書きしたい色だけ HEX で指定（事業の雰囲気に合わせて調整）',
            properties: {
              primary: hex,
              background: hex,
              surface: hex,
              text: hex,
              mutedText: hex,
              onPrimary: hex,
              line: hex,
              accent: hex,
            },
          },
          headingFont: {
            type: 'string',
            enum: SITE_FONT_IDS,
            description: `見出しフォントを preset から変えたい場合のみ。${SITE_FONT_IDS.map((id) => `${id}=${SITE_FONTS[id].vibe}`).join(' / ')}`,
          },
          bodyFont: {
            type: 'string',
            enum: BODY_FONT_IDS,
            description: '本文フォント。読みやすさ重視の選択肢のみ',
          },
          sectionSpacing: { type: 'string', enum: ['compact', 'normal', 'spacious'] },
          containerWidth: { type: 'string', enum: ['narrow', 'normal', 'wide'] },
          buttonShape: { type: 'string', enum: ['square', 'rounded', 'pill'] },
          headingAccent: {
            type: 'string',
            enum: ['none', 'bar', 'rule', 'underline'],
            description:
              '見出しのあしらい。bar=短い下線 / rule=縦の細線 / underline=太いマーカー風',
          },
          imageTreatment: {
            type: 'string',
            enum: ['plain', 'frame', 'offset'],
            description: '写真の見せ方。frame=額装風 / offset=ずらした色面の影',
          },
          sectionDivider: { type: 'string', enum: ['none', 'line'] },
          motion: {
            type: 'string',
            enum: ['none', 'rise'],
            description: 'スクロール時の入場モーション',
          },
        },
        required: ['preset'],
      },
    },
    required: ['brief', 'design'],
  }
}

// ────────────────────────────────────────────── validation / fallback

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asTrimmed(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim()
  if (typeof v === 'number') return String(v)
  return undefined
}

/** href として許可する形式以外は '#' に落とす */
export function sanitizeHref(href: string): string {
  const h = href.trim()
  if (/^(#|\/|tel:|mailto:|https:\/\/|http:\/\/)/.test(h)) return h
  return '#'
}

function sanitizeCta(v: unknown): CtaLink | undefined {
  if (!isRecord(v)) return undefined
  const label = asTrimmed(v.label)
  const href = asTrimmed(v.href)
  if (!label || !href) return undefined
  return { label, href: sanitizeHref(href) }
}

/** AI出力の画像指定を AssetReference へ。素材IDが実在しなければ placeholder に落とす */
export function sanitizeImage(v: unknown, assetIds: Set<string>): AssetReference | undefined {
  if (!isRecord(v)) return undefined
  // AI schema の {source, materialId} 形式と、内部の {type} 形式の両方を受ける
  const source = asTrimmed(v.source) ?? asTrimmed(v.type)
  if (source === 'material') {
    const id = asTrimmed(v.materialId) ?? asTrimmed(v.id)
    if (id && assetIds.has(id)) return { type: 'material', id }
  }
  if (source === 'url') {
    const url = asTrimmed(v.url)
    if (url && /^https:\/\//.test(url)) return { type: 'url', url, alt: asTrimmed(v.alt) }
  }
  const ratioRaw = asTrimmed(v.aspectRatio)
  const aspectRatio = (ASPECT_RATIOS.includes(ratioRaw ?? '') ? ratioRaw : '4/3') as
    Extract<AssetReference, { type: 'placeholder' }>['aspectRatio']
  return {
    type: 'placeholder',
    aspectRatio,
    intent: asTrimmed(v.intent) ?? '事業の雰囲気が伝わる写真',
  }
}

function sanitizeScalar(
  spec: ScalarFieldSpec,
  value: unknown,
  assetIds: Set<string>,
): unknown {
  switch (spec.kind) {
    case 'string':
    case 'text':
      return asTrimmed(value)
    case 'enum': {
      const s = asTrimmed(value)
      return s && spec.values?.includes(s) ? s : undefined
    }
    case 'image':
      return sanitizeImage(value, assetIds)
    case 'cta':
      return sanitizeCta(value)
  }
}

/**
 * 必須項目が欠けたときの中立な補完値。
 * カタログの defaults（架空のサンプル文）を実サイトへ流用しないための安全弁
 */
function neutralScalar(spec: ScalarFieldSpec): unknown {
  switch (spec.kind) {
    case 'string':
    case 'text':
      return '（あとで入力）'
    case 'enum':
      return spec.values?.[0]
    case 'image':
      return {
        type: 'placeholder',
        aspectRatio: '4/3',
        intent: '事業の雰囲気が伝わる写真',
      } satisfies AssetReference
    case 'cta':
      return { label: 'お問い合わせ', href: '#contact' } satisfies CtaLink
  }
}

/**
 * コンポーネント1つ分の props を検証・補完する。
 * 未知キーは捨て、必須スカラーが欠けたら中立値で補う。
 * 必須の items（リスト）が空ならセクション自体を成立させない（null を返す）
 */
export function sanitizeProps(
  def: ComponentDef,
  raw: unknown,
  assetIds: Set<string>,
): Record<string, unknown> | null {
  const input = isRecord(raw) ? raw : {}
  const out: Record<string, unknown> = {}

  for (const [key, spec] of Object.entries(def.fields)) {
    const value = input[key]
    if (spec.kind === 'items') {
      const items = Array.isArray(value)
        ? value
            .slice(0, spec.max)
            .map((item) => {
              if (!isRecord(item)) return null
              const cleaned: Record<string, unknown> = {}
              for (const [ik, ispec] of Object.entries(spec.item)) {
                const v = sanitizeScalar(ispec, item[ik], assetIds)
                if (v !== undefined) cleaned[ik] = v
                else if (ispec.required) return null
              }
              return cleaned
            })
            .filter((x): x is Record<string, unknown> => x !== null)
        : []
      if (items.length > 0) out[key] = items
      // 中身のないリストは補完しようがない。セクションごと除外して自然な構成を保つ
      else if (spec.required) return null
      continue
    }

    const v = sanitizeScalar(spec, value, assetIds)
    if (v !== undefined) out[key] = v
    else if (spec.required) out[key] = neutralScalar(spec)
  }
  return out
}

function sanitizeSlug(raw: unknown, fallback: string): string {
  const s = asTrimmed(raw)?.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return s && s.length > 0 ? s : fallback
}

export interface ValidationIssue {
  message: string
}

/**
 * AI が返したサイト構成を検証し、必ず表示可能な SiteData に整える。
 * - 未知コンポーネント・壊れた props は除去または defaults で補完
 * - 各ページにヘッダー・フッターを保証
 * - 全セクションに stable ID を付与
 */
export function validateSiteContent(
  raw: unknown,
  brief: SiteBrief,
  tokens: DesignTokens,
  assets: SiteAsset[],
): { site: SiteData; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const assetIds = new Set(assets.map((a) => a.id))
  const input = isRecord(raw) ? raw : {}
  const rawPages = Array.isArray(input.pages) ? input.pages.slice(0, 5) : []

  const pages: SitePage[] = []
  const usedSlugs = new Set<string>()

  rawPages.forEach((rawPage, pi) => {
    if (!isRecord(rawPage)) return
    let slug = sanitizeSlug(rawPage.slug, `page-${pi + 1}`)
    if (pi === 0) slug = 'home'
    while (usedSlugs.has(slug)) slug = `${slug}-2`
    usedSlugs.add(slug)

    const title = asTrimmed(rawPage.title) ?? (pi === 0 ? 'ホーム' : `ページ${pi + 1}`)
    const rawSections = Array.isArray(rawPage.sections) ? rawPage.sections.slice(0, 12) : []

    const sections: SiteSection[] = []
    rawSections.forEach((rawSec) => {
      if (!isRecord(rawSec)) return
      const name = asTrimmed(rawSec.component)
      const def = name ? CATALOG_BY_NAME[name] : undefined
      if (!def) {
        if (name) issues.push({ message: `未知のコンポーネント "${name}" を除外しました` })
        return
      }
      const props = sanitizeProps(def, rawSec.props, assetIds)
      if (props === null) {
        issues.push({ message: `${slug}: ${def.component} は必須リストが空のため除外しました` })
        return
      }
      const style = sanitizeSectionStyle(rawSec.style)
      sections.push({
        id: `${slug}-s${sections.length + 1}`,
        component: def.component,
        props,
        ...(style ? { style } : {}),
      })
    })

    // ヘッダー・フッターが無ければ標準のものを補う
    if (!sections.some((s) => CATALOG_BY_NAME[s.component]?.category === 'header')) {
      sections.unshift({
        id: `${slug}-header`,
        component: 'HeaderSimple',
        props: { siteName: brief.siteName },
      })
      issues.push({ message: `${slug}: ヘッダーを自動追加しました` })
    }
    if (!sections.some((s) => CATALOG_BY_NAME[s.component]?.category === 'footer')) {
      sections.push({
        id: `${slug}-footer`,
        component: 'FooterSimple',
        props: { siteName: brief.siteName },
      })
      issues.push({ message: `${slug}: フッターを自動追加しました` })
    }

    pages.push({ id: `page-${slug}`, slug, title, sections })
  })

  if (pages.length === 0) {
    issues.push({ message: 'ページが生成されなかったため、最小構成で作成しました' })
    pages.push({
      id: 'page-home',
      slug: 'home',
      title: 'ホーム',
      sections: [
        { id: 'home-header', component: 'HeaderSimple', props: { siteName: brief.siteName } },
        {
          id: 'home-s1',
          component: 'HeroCentered',
          props: { title: brief.tagline || brief.siteName },
        },
        { id: 'home-footer', component: 'FooterSimple', props: { siteName: brief.siteName } },
      ],
    })
  }

  return { site: { version: 1, brief, designTokens: tokens, pages, assets }, issues }
}

/**
 * AI のデザイン出力（preset + 上書き）を DesignTokens へ。
 * base を渡すと preset 未指定時にそれを土台にする（編集時の部分変更用）
 */
export function buildTokensFromDesign(raw: unknown, base?: DesignTokens): DesignTokens {
  const input = isRecord(raw) ? raw : {}
  const preset =
    typeof input.preset === 'string' && input.preset in TOKEN_PRESETS
      ? TOKEN_PRESETS[input.preset as TokenPresetId]
      : (base ?? TOKEN_PRESETS['trust-blue'])

  const colors = { ...preset.colors }
  if (isRecord(input.colors)) {
    for (const key of Object.keys(colors) as (keyof typeof colors)[]) {
      const v = input.colors[key]
      if (typeof v === 'string' && HEX_RE.test(v)) colors[key] = v
    }
  }

  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback

  return {
    colors,
    typography: {
      ...preset.typography,
      headingFont: pick(input.headingFont, SITE_FONT_IDS, preset.typography.headingFont),
      bodyFont: pick(input.bodyFont, BODY_FONT_IDS, preset.typography.bodyFont),
    },
    layout: {
      sectionSpacing: pick(
        input.sectionSpacing,
        ['compact', 'normal', 'spacious'] as const,
        preset.layout.sectionSpacing,
      ),
      containerWidth: pick(
        input.containerWidth,
        ['narrow', 'normal', 'wide'] as const,
        preset.layout.containerWidth,
      ),
    },
    radius: {
      ...preset.radius,
      button: pick(input.buttonShape, ['square', 'rounded', 'pill'] as const, preset.radius.button),
    },
    shadow: preset.shadow,
    decor: {
      headingAccent: pick(
        input.headingAccent,
        ['none', 'bar', 'rule', 'underline'] as const,
        preset.decor.headingAccent,
      ),
      imageTreatment: pick(
        input.imageTreatment,
        ['plain', 'frame', 'offset'] as const,
        preset.decor.imageTreatment,
      ),
      sectionDivider: pick(
        input.sectionDivider,
        ['none', 'line'] as const,
        preset.decor.sectionDivider,
      ),
      motion: pick(input.motion, ['none', 'rise'] as const, preset.decor.motion),
    },
  }
}

/** AI のブリーフ出力を SiteBrief へ（欠損はヒアリング情報で補う前提の最低限） */
export function sanitizeBrief(raw: unknown, fallbackName: string): SiteBrief {
  const input = isRecord(raw) ? raw : {}
  const strArray = (v: unknown, max: number): string[] =>
    Array.isArray(v)
      ? v.map(asTrimmed).filter((s): s is string => Boolean(s)).slice(0, max)
      : []
  return {
    siteName: asTrimmed(input.siteName) ?? fallbackName,
    tagline: asTrimmed(input.tagline) ?? '',
    industry: asTrimmed(input.industry) ?? '',
    audience: asTrimmed(input.audience) ?? '',
    toneKeywords: strArray(input.toneKeywords, 5),
    keyMessages: strArray(input.keyMessages, 3),
  }
}
