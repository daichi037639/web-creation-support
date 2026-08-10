// SiteData（canonical）⇔ Puck Data（Visual Editor の view）の変換。
// LOG-012 の方針どおり、Puck 導入後も source of truth は SiteData のまま。
// すべて pure 関数（unit test 対象）

import type { Data } from '@measured/puck'
import {
  CATALOG_BY_NAME,
  type ComponentDef,
  type FieldSpec,
  type ScalarFieldSpec,
} from '@/lib/site/catalog'
import { sanitizeProps, sanitizeSectionStyle } from '@/lib/site/schema'
import type { AssetReference, SectionStyle, SiteData, SiteSection } from '@/types/site'

// ─────────────────────────────── 画像参照 ⇔ Puck の object field

export interface PuckImageValue {
  source: 'material' | 'placeholder' | 'url'
  materialId?: string
  url?: string
  aspectRatio?: string
  intent?: string
}

export function imageRefToPuck(ref: unknown): PuckImageValue {
  const r = ref as AssetReference | undefined
  if (r?.type === 'material') return { source: 'material', materialId: r.id }
  if (r?.type === 'url') return { source: 'url', url: r.url }
  if (r?.type === 'placeholder') {
    return { source: 'placeholder', aspectRatio: r.aspectRatio, intent: r.intent }
  }
  return { source: 'placeholder', aspectRatio: '4/3', intent: '' }
}

export function puckImageToRef(value: unknown): Record<string, unknown> {
  const v = (value ?? {}) as PuckImageValue
  if (v.source === 'material' && v.materialId) {
    // schema.ts の sanitizeImage が受ける AI 形式に合わせる
    return { source: 'material', materialId: v.materialId }
  }
  if (v.source === 'url' && v.url) return { source: 'url', url: v.url }
  return {
    source: 'placeholder',
    aspectRatio: v.aspectRatio ?? '4/3',
    intent: v.intent || '事業の雰囲気が伝わる写真',
  }
}

// ─────────────────────────────── style ⇔ Puck（select の「おまかせ」= 空文字）

export function styleToPuck(style: SectionStyle | undefined): Record<string, string> {
  const s = (style ?? {}) as Record<string, string>
  return {
    background: s.background ?? '',
    spacing: s.spacing ?? '',
    align: s.align ?? '',
    headingScale: s.headingScale ?? '',
    imageRatio: s.imageRatio ?? '',
    divider: s.divider ?? '',
    motion: s.motion ?? '',
  }
}

export function puckStyleToSection(value: unknown): SectionStyle | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const cleaned = Object.fromEntries(
    Object.entries(value as Record<string, string>).filter(([, v]) => v !== ''),
  )
  return sanitizeSectionStyle(cleaned)
}

// ─────────────────────────────── props の変換（image フィールドだけ形が違う）

function propsToPuck(def: ComponentDef, props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...props }
  for (const [key, spec] of Object.entries(def.fields)) {
    if (spec.kind === 'image') {
      out[key] = imageRefToPuck(props[key])
    } else if (spec.kind === 'items' && Array.isArray(props[key])) {
      out[key] = (props[key] as Record<string, unknown>[]).map((item) => {
        const converted = { ...item }
        for (const [ik, ispec] of Object.entries(spec.item)) {
          if (ispec.kind === 'image') converted[ik] = imageRefToPuck(item[ik])
        }
        return converted
      })
    }
  }
  return out
}

function puckPropsToSection(
  def: ComponentDef,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(def.fields)) {
    const value = raw[key]
    if (value === undefined) continue
    if (spec.kind === 'image') {
      out[key] = puckImageToRef(value)
    } else if (spec.kind === 'items' && Array.isArray(value)) {
      out[key] = value.map((item) => {
        const converted = { ...(item as Record<string, unknown>) }
        for (const [ik, ispec] of Object.entries(spec.item)) {
          if (ispec.kind === 'image') converted[ik] = puckImageToRef(converted[ik])
        }
        return converted
      })
    } else {
      out[key] = value
    }
  }
  return out
}

// ─────────────────────────────── Puck 用の中立な初期値
// Puck は defaultProps を「欠損している props」へもマージするため、
// カタログの defaults（架空のサンプル文）を渡すと実サイトに混入する。
// エディタには中立な初期値だけを渡す（LOG-014 の方針を維持）

function neutralPuckScalar(spec: ScalarFieldSpec, key: string): unknown {
  switch (spec.kind) {
    case 'string':
    case 'text':
      if (key === 'title') return '見出しを入力'
      if (key === 'siteName') return 'サイト名'
      return ''
    case 'enum':
      return spec.values?.[0] ?? ''
    case 'image':
      return { source: 'placeholder', aspectRatio: '4/3', intent: '' }
    case 'cta':
      return { label: 'ボタン', href: '#contact' }
  }
}

/** ドラッグ追加時の初期値（Puck 形式）。サンプル文を含まない */
export function neutralPuckProps(def: ComponentDef): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(def.fields as Record<string, FieldSpec>)) {
    if (spec.kind === 'items') {
      const item: Record<string, unknown> = {}
      for (const [ik, ispec] of Object.entries(spec.item)) {
        item[ik] = neutralPuckScalar(ispec, ik)
      }
      out[key] = [item]
    } else {
      out[key] = neutralPuckScalar(spec, key)
    }
  }
  return out
}

// ─────────────────────────────── Site ⇔ Puck Data

export function siteToPuckData(site: SiteData, pageSlug: string): Data {
  const page = site.pages.find((p) => p.slug === pageSlug) ?? site.pages[0]
  return {
    root: { props: {} },
    content: page.sections
      .filter((s) => CATALOG_BY_NAME[s.component])
      .map((s) => ({
        type: s.component,
        props: {
          id: s.id,
          ...propsToPuck(CATALOG_BY_NAME[s.component], s.props),
          style: styleToPuck(s.style),
        },
      })),
  }
}

/**
 * Puck の編集結果を canonical な SiteData に書き戻す。
 * props は生成時と同じ sanitize を通し、ヘッダー先頭・フッター末尾を保証する
 */
export function puckDataToSite(site: SiteData, pageSlug: string, data: Data): SiteData {
  const page = site.pages.find((p) => p.slug === pageSlug) ?? site.pages[0]
  const assetIds = new Set(site.assets.map((a) => a.id))
  const usedIds = new Set<string>()

  let sections: SiteSection[] = (data.content ?? [])
    .filter((item) => CATALOG_BY_NAME[item.type as string])
    .map((item, i) => {
      const def = CATALOG_BY_NAME[item.type as string]
      const { id, style, ...rawProps } = item.props as Record<string, unknown>
      const raw = puckPropsToSection(def, rawProps)
      // 編集途中（リストを空にした等）でもセクションを消さない：
      // sanitize が不成立なら raw のまま描画に任せる
      const props = sanitizeProps(def, raw, assetIds) ?? raw
      let sectionId = typeof id === 'string' && id ? id : `${page.slug}-p${i + 1}`
      while (usedIds.has(sectionId)) sectionId = `${sectionId}x`
      usedIds.add(sectionId)
      const sectionStyle = puckStyleToSection(style)
      return {
        id: sectionId,
        component: def.component,
        props,
        ...(sectionStyle ? { style: sectionStyle } : {}),
      }
    })

  // ヘッダー・フッターの保証（エディタ上で削除されても復元する）
  const isCat = (s: SiteSection, cat: string) => CATALOG_BY_NAME[s.component]?.category === cat
  const headers = sections.filter((s) => isCat(s, 'header'))
  const footers = sections.filter((s) => isCat(s, 'footer'))
  sections = sections.filter((s) => !isCat(s, 'header') && !isCat(s, 'footer'))
  sections.unshift(
    headers[0] ?? {
      id: `${page.slug}-header`,
      component: 'HeaderSimple',
      props: { siteName: site.brief.siteName },
    },
  )
  sections.push(
    footers[0] ?? {
      id: `${page.slug}-footer`,
      component: 'FooterSimple',
      props: { siteName: site.brief.siteName },
    },
  )

  return {
    ...site,
    pages: site.pages.map((p) => (p.id === page.id ? { ...p, sections } : p)),
  }
}
