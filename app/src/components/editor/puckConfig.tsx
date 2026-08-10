'use client'

// カタログ（lib/site/catalog.ts）から Puck の Config を自動生成する。
// コンポーネントを追加すれば AI 生成・validation と同時にエディタにも現れる。
// SiteData が canonical であり、Puck はあくまで view（LOG-016）

import { createContext, createElement, useContext, type ReactNode } from 'react'
import type { Config, Field } from '@measured/puck'
import {
  CATALOG_BY_NAME,
  CATEGORY_LABELS,
  COMPONENT_CATALOG,
  type ComponentCategory,
  type FieldSpec,
  type ScalarFieldSpec,
} from '@/lib/site/catalog'
import { SECTION_STYLE_VALUES } from '@/lib/site/schema'
import {
  neutralPuckProps,
  puckImageToRef,
  puckStyleToSection,
  styleToPuck,
} from '@/lib/site/puckData'
import { sanitizeImage } from '@/lib/site/schema'
import {
  googleFontsHref,
  rootDecorAttrs,
  sectionWrapperProps,
  SITE_BASE_CSS,
  tokensToCssVars,
} from '@/lib/site/tokens'
import { navForSite, prepareSectionProps } from '@/components/site/SiteRenderer'
import { SITE_COMPONENTS } from '@/components/site'
import type { SiteData, SiteSection } from '@/types/site'

// ─────────────────────────────── サイトコンテキスト（素材解決・nav・トークン）

const EditorSiteContext = createContext<SiteData | null>(null)

export function EditorSiteProvider({
  site,
  children,
}: {
  site: SiteData
  children: ReactNode
}) {
  return <EditorSiteContext.Provider value={site}>{children}</EditorSiteContext.Provider>
}

function useEditorSite(): SiteData {
  const site = useContext(EditorSiteContext)
  if (!site) throw new Error('EditorSiteProvider missing')
  return site
}

// ─────────────────────────────── フィールドの日本語ラベル

const KEY_LABELS: Record<string, string> = {
  title: '見出し',
  eyebrow: '小さなラベル',
  description: '説明文',
  body: '本文',
  lead: 'リード文',
  quote: '引用・一言',
  image: '写真',
  items: '項目',
  cta: 'ボタン',
  primaryCta: 'メインボタン',
  secondaryCta: 'サブボタン',
  imagePosition: '写真の位置',
  siteName: 'サイト名',
  tagline: '一言',
  name: '名前',
  price: '価格',
  author: '名前',
  meta: '補足',
  question: '質問',
  answer: '回答',
  label: 'ラベル',
  value: '内容',
  address: '住所',
  tel: '電話番号',
  hours: '営業時間',
  closed: '定休日',
  note: '注記',
  subNote: '小さな注記',
  email: 'メールアドレス',
  showMap: '地図を表示',
  icon: 'アイコン',
  caption: 'キャプション',
}

const labelFor = (key: string): string => KEY_LABELS[key] ?? key

// ─────────────────────────────── FieldSpec → Puck Field

function imageField(site: SiteData, label: string): Field {
  const materialOptions = site.assets.map((a) => ({
    label: a.caption || a.kind,
    value: a.id,
  }))
  return {
    type: 'object',
    label,
    objectFields: {
      source: {
        type: 'radio',
        label: '写真の種類',
        options: [
          ...(materialOptions.length > 0
            ? [{ label: 'アップロード済み', value: 'material' }]
            : []),
          { label: 'あとで用意（枠のみ）', value: 'placeholder' },
        ],
      },
      ...(materialOptions.length > 0
        ? { materialId: { type: 'select', label: '写真を選ぶ', options: [{ label: '—', value: '' }, ...materialOptions] } as Field }
        : {}),
      intent: { type: 'text', label: '入れたい写真の内容' },
      aspectRatio: {
        type: 'select',
        label: '縦横比',
        options: ['1/1', '4/3', '3/2', '16/9', '3/4'].map((v) => ({ label: v, value: v })),
      },
    },
  }
}

function scalarField(spec: ScalarFieldSpec, key: string, site: SiteData): Field {
  const label = labelFor(key)
  switch (spec.kind) {
    case 'string':
      return { type: 'text', label }
    case 'text':
      return { type: 'textarea', label }
    case 'enum':
      return {
        type: key === 'icon' ? 'select' : 'radio',
        label,
        options: (spec.values ?? []).map((v) => ({ label: v, value: v })),
      }
    case 'image':
      return imageField(site, label)
    case 'cta':
      return {
        type: 'object',
        label,
        objectFields: {
          label: { type: 'text', label: 'ボタンの文字' },
          href: { type: 'text', label: 'リンク先（/ページ名・#contact・tel:番号 など）' },
        },
      }
  }
}

function fieldForSpec(spec: FieldSpec, key: string, site: SiteData): Field {
  if (spec.kind === 'items') {
    const arrayFields: Record<string, Field> = {}
    for (const [ik, ispec] of Object.entries(spec.item)) {
      arrayFields[ik] = scalarField(ispec, ik, site)
    }
    return {
      type: 'array',
      label: labelFor(key),
      arrayFields,
      max: spec.max,
      getItemSummary: (item: Record<string, unknown>, i?: number) =>
        String(item.title ?? item.name ?? item.question ?? item.label ?? item.author ?? `項目 ${(i ?? 0) + 1}`),
    }
  }
  return scalarField(spec, key, site)
}

const styleSelect = (key: keyof typeof SECTION_STYLE_VALUES, label: string): Field => ({
  type: 'select',
  label,
  options: [
    { label: 'おまかせ', value: '' },
    ...SECTION_STYLE_VALUES[key]
      .filter((v) => v !== 'inherit')
      .map((v) => ({ label: v, value: v })),
  ],
})

const STYLE_FIELD: Field = {
  type: 'object',
  label: '見た目の調整',
  objectFields: {
    background: styleSelect('background', '背景'),
    spacing: styleSelect('spacing', '余白'),
    align: styleSelect('align', '見出しの揃え'),
    headingScale: styleSelect('headingScale', '見出しの大きさ'),
    imageRatio: styleSelect('imageRatio', '写真の縦横比'),
    divider: styleSelect('divider', '区切り線'),
    motion: styleSelect('motion', '動き'),
  },
}

// ─────────────────────────────── config 本体

const CATEGORY_ORDER: ComponentCategory[] = [
  'hero', 'story', 'features', 'products', 'gallery', 'testimonials',
  'faq', 'cta', 'access', 'contact', 'header', 'footer',
]

export function buildPuckConfig(site: SiteData): Config {
  const components: Config['components'] = {}

  for (const def of COMPONENT_CATALOG) {
    const fields: Record<string, Field> = {}
    for (const [key, spec] of Object.entries(def.fields)) {
      fields[key] = fieldForSpec(spec, key, site)
    }
    fields.style = STYLE_FIELD

    components[def.component] = {
      label: def.component,
      fields: fields as never,
      // 注意: Puck は defaultProps を既存データの欠損 props にもマージするため、
      // カタログの defaults（架空サンプル文）ではなく中立な初期値を渡す
      defaultProps: {
        ...neutralPuckProps(def),
        style: styleToPuck(undefined),
      } as never,
      render: (rawProps: Record<string, unknown>) => (
        <SectionPreview component={def.component} rawProps={rawProps} />
      ),
    }
  }

  return {
    components,
    categories: Object.fromEntries(
      CATEGORY_ORDER.map((cat) => [
        cat,
        {
          title: CATEGORY_LABELS[cat],
          components: COMPONENT_CATALOG.filter((d) => d.category === cat).map(
            (d) => d.component,
          ),
        },
      ]),
    ) as never,
    root: {
      render: ({ children }: { children: ReactNode }) => <EditorRoot>{children}</EditorRoot>,
    },
  }
}

// ─────────────────────────────── プレビュー描画（SiteRenderer と同じ経路）

function SectionPreview({
  component,
  rawProps,
}: {
  component: string
  rawProps: Record<string, unknown>
}) {
  const site = useEditorSite()
  const def = CATALOG_BY_NAME[component]
  const Component = SITE_COMPONENTS[component]
  if (!def || !Component) return null

  const { id, style, ...rest } = rawProps
  const props: Record<string, unknown> = { ...rest }
  // Puck が注入する編集用の内部 props は描画に渡さない
  delete props.puck
  delete props.editMode

  // Puck の props（画像は {source,...} 形式）→ AssetReference へ
  const converted: Record<string, unknown> = { ...props }
  const assetIds = new Set(site.assets.map((a) => a.id))
  for (const [key, spec] of Object.entries(def.fields)) {
    if (spec.kind === 'image' && converted[key] !== undefined) {
      converted[key] = sanitizeImage(puckImageToRef(converted[key]), assetIds)
    } else if (spec.kind === 'items' && Array.isArray(converted[key])) {
      converted[key] = (converted[key] as Record<string, unknown>[]).map((item) => {
        const out = { ...item }
        for (const [ik, ispec] of Object.entries(spec.item)) {
          if (ispec.kind === 'image' && out[ik] !== undefined) {
            out[ik] = sanitizeImage(puckImageToRef(out[ik]), assetIds)
          }
        }
        return out
      })
    }
  }

  const section: SiteSection = {
    id: typeof id === 'string' ? id : 'editing',
    component,
    props: converted,
    style: puckStyleToSection(style),
  }
  const resolved = prepareSectionProps(section, site, navForSite(site))
  const { attrs, vars } = sectionWrapperProps(section.style, site.designTokens)

  return (
    <div data-sid={section.id} {...attrs} style={vars as never}>
      {createElement(Component as never, { sectionId: section.id, ...resolved } as never)}
    </div>
  )
}

function EditorRoot({ children }: { children: ReactNode }) {
  const site = useEditorSite()
  const tokens = site.designTokens
  return (
    <div
      className="site-root min-h-screen"
      style={tokensToCssVars(tokens)}
      {...rootDecorAttrs(tokens)}
    >
      <link rel="stylesheet" href={googleFontsHref(tokens)} />
      <style dangerouslySetInnerHTML={{ __html: SITE_BASE_CSS }} />
      {children}
    </div>
  )
}
