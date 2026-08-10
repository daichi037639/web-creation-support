// 自然言語による部分編集エンジン（LOG-015 / P5b）。
// ユーザーの要求を AI が7つの操作のどれかに変換し、サイト全体を再生成せずに
// 最小範囲だけ更新する。適用は必ずこのファイルの validation を通る。
// すべて pure 関数（unit test 対象）。AI 呼び出しは API route 側で行う

import {
  CATALOG_BY_NAME,
  COMPONENT_CATALOG,
} from '@/lib/site/catalog'
import {
  buildSiteDesignToolSchema,
  buildTokensFromDesign,
  sanitizeProps,
  sanitizeSectionStyle,
  SECTION_STYLE_VALUES,
} from '@/lib/site/schema'
import { resolveFonts, SITE_FONTS } from '@/lib/site/tokens'
import type { SiteData, SitePage, SiteSection } from '@/types/site'

// ─────────────────────────────── 操作の型

export type EditOperationKind =
  | 'none'
  | 'patch_content'
  | 'patch_style'
  | 'set_tokens'
  | 'replace_component'
  | 'reorder_sections'
  | 'add_section'
  | 'remove_section'

export interface EditOperationInput {
  operation: EditOperationKind
  /** ユーザーへ表示する短い説明（必須） */
  explanation: string
  sectionId?: string
  pageSlug?: string
  component?: string
  props?: unknown
  style?: unknown
  tokens?: unknown
  order?: unknown
  /** add_section の挿入位置。セクションID / 'start'（ヘッダー直後）/ 'end'（フッター直前） */
  afterSectionId?: string
}

export type EditResult =
  | { ok: true; site: SiteData }
  | { ok: false; error: string }

// ─────────────────────────────── ユーティリティ

function findSection(
  site: SiteData,
  sectionId: string | undefined,
): { page: SitePage; index: number; section: SiteSection } | null {
  if (!sectionId) return null
  for (const page of site.pages) {
    const index = page.sections.findIndex((s) => s.id === sectionId)
    if (index >= 0) return { page, index, section: page.sections[index] }
  }
  return null
}

function replacePage(site: SiteData, page: SitePage, sections: SiteSection[]): SiteData {
  return {
    ...site,
    pages: site.pages.map((p) => (p.id === page.id ? { ...p, sections } : p)),
  }
}

function categoryOf(section: SiteSection): string {
  return CATALOG_BY_NAME[section.component]?.category ?? ''
}

/** ページ内で未使用のセクションIDを払い出す（Date/乱数を使わず決定的に） */
function newSectionId(page: SitePage): string {
  const used = new Set(page.sections.map((s) => s.id))
  let n = page.sections.length + 1
  while (used.has(`${page.slug}-s${n}`)) n++
  return `${page.slug}-s${n}`
}

// ─────────────────────────────── 操作の適用

export function applyEditOperation(site: SiteData, op: EditOperationInput): EditResult {
  const assetIds = new Set(site.assets.map((a) => a.id))

  switch (op.operation) {
    case 'patch_content': {
      const found = findSection(site, op.sectionId)
      if (!found) return { ok: false, error: '対象のセクションが見つかりませんでした' }
      const def = CATALOG_BY_NAME[found.section.component]
      const props = sanitizeProps(def, op.props, assetIds)
      if (props === null) return { ok: false, error: '変更内容が不完全でした（リストが空）' }
      const sections = [...found.page.sections]
      sections[found.index] = { ...found.section, props }
      return { ok: true, site: replacePage(site, found.page, sections) }
    }

    case 'patch_style': {
      const found = findSection(site, op.sectionId)
      if (!found) return { ok: false, error: '対象のセクションが見つかりませんでした' }
      // 指定されなかったキーは現状維持（最小変更）
      const merged = sanitizeSectionStyle({
        ...(found.section.style ?? {}),
        ...(typeof op.style === 'object' && op.style !== null ? op.style : {}),
      })
      const sections = [...found.page.sections]
      const next: SiteSection = { ...found.section }
      if (merged) next.style = merged
      else delete next.style
      sections[found.index] = next
      return { ok: true, site: replacePage(site, found.page, sections) }
    }

    case 'set_tokens': {
      const tokens = buildTokensFromDesign(op.tokens, site.designTokens)
      return { ok: true, site: { ...site, designTokens: tokens } }
    }

    case 'replace_component': {
      const found = findSection(site, op.sectionId)
      if (!found) return { ok: false, error: '対象のセクションが見つかりませんでした' }
      const def = op.component ? CATALOG_BY_NAME[op.component] : undefined
      if (!def) return { ok: false, error: '未知のコンポーネントが指定されました' }
      const props = sanitizeProps(def, op.props, assetIds)
      if (props === null) return { ok: false, error: '変更内容が不完全でした（リストが空）' }
      const sections = [...found.page.sections]
      sections[found.index] = { ...found.section, component: def.component, props }
      return { ok: true, site: replacePage(site, found.page, sections) }
    }

    case 'reorder_sections': {
      const page = site.pages.find((p) => p.slug === op.pageSlug) ?? site.pages[0]
      const order = Array.isArray(op.order) ? (op.order as string[]) : []
      const current = page.sections.map((s) => s.id)
      if (
        order.length !== current.length ||
        [...order].sort().join() !== [...current].sort().join()
      ) {
        return { ok: false, error: '並び替えの内容が現在の構成と一致しませんでした' }
      }
      const byId = new Map(page.sections.map((s) => [s.id, s]))
      const sections = order.map((id) => byId.get(id)!)
      if (
        categoryOf(sections[0]) !== 'header' ||
        categoryOf(sections[sections.length - 1]) !== 'footer'
      ) {
        return { ok: false, error: 'ヘッダーは先頭・フッターは末尾から動かせません' }
      }
      return { ok: true, site: replacePage(site, page, sections) }
    }

    case 'add_section': {
      const page = site.pages.find((p) => p.slug === op.pageSlug) ?? site.pages[0]
      const def = op.component ? CATALOG_BY_NAME[op.component] : undefined
      if (!def) return { ok: false, error: '未知のコンポーネントが指定されました' }
      if (def.category === 'header' || def.category === 'footer') {
        return { ok: false, error: 'ヘッダー・フッターは追加できません' }
      }
      const props = sanitizeProps(def, op.props, assetIds)
      if (props === null) return { ok: false, error: '追加内容が不完全でした（リストが空）' }
      const style = sanitizeSectionStyle(op.style)
      const section: SiteSection = {
        id: newSectionId(page),
        component: def.component,
        props,
        ...(style ? { style } : {}),
      }
      const sections = [...page.sections]
      let index: number
      if (op.afterSectionId === 'start') {
        index = categoryOf(sections[0]) === 'header' ? 1 : 0
      } else if (op.afterSectionId && op.afterSectionId !== 'end') {
        const at = sections.findIndex((s) => s.id === op.afterSectionId)
        index = at >= 0 ? at + 1 : sections.length - 1
      } else {
        index =
          categoryOf(sections[sections.length - 1]) === 'footer'
            ? sections.length - 1
            : sections.length
      }
      sections.splice(index, 0, section)
      return { ok: true, site: replacePage(site, page, sections) }
    }

    case 'remove_section': {
      const found = findSection(site, op.sectionId)
      if (!found) return { ok: false, error: '対象のセクションが見つかりませんでした' }
      const category = categoryOf(found.section)
      if (category === 'header' || category === 'footer') {
        return { ok: false, error: 'ヘッダー・フッターは削除できません' }
      }
      const sections = found.page.sections.filter((s) => s.id !== found.section.id)
      return { ok: true, site: replacePage(site, found.page, sections) }
    }

    case 'none':
      return { ok: false, error: op.explanation }
  }
}

// ─────────────────────────────── AI 向け schema・コンテキスト

type Json = Record<string, unknown>

export function buildEditToolSchema(): Json {
  const designSchema = buildSiteDesignToolSchema() as {
    properties: { design: Json }
  }
  return {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: [
          'none',
          'patch_content',
          'patch_style',
          'set_tokens',
          'replace_component',
          'reorder_sections',
          'add_section',
          'remove_section',
        ],
        description: 'ユーザーの要求に対する最小の操作を1つ選ぶ',
      },
      explanation: {
        type: 'string',
        description: '何をどう変えたかのユーザー向けの短い説明（です・ます調）。operation が none のときは、できない理由や質問への回答',
      },
      sectionId: { type: 'string', description: '対象セクションのID' },
      pageSlug: { type: 'string', description: '対象ページのslug（reorder / add で使用）' },
      component: {
        type: 'string',
        enum: COMPONENT_CATALOG.map((d) => d.component),
        description: 'replace_component / add_section で使うコンポーネント名',
      },
      props: {
        type: 'object',
        description:
          'patch_content / replace_component / add_section の完全な props（変更しない項目も現在の値をそのまま含めた完成形を返す）',
      },
      style: {
        type: 'object',
        description: `patch_style で変更するキーだけを含む SectionStyle。許容値: ${JSON.stringify(SECTION_STYLE_VALUES)}`,
      },
      tokens: {
        ...designSchema.properties.design,
        description:
          'set_tokens 用。変更したい項目だけを含める（preset を指定すると全体をその preset ベースに置き換える）',
      },
      order: {
        type: 'array',
        items: { type: 'string' },
        description: 'reorder_sections 用。対象ページの全セクションIDを新しい順で',
      },
      afterSectionId: {
        type: 'string',
        description: "add_section の挿入位置。既存セクションID / 'start'（ヘッダー直後）/ 'end'（フッター直前）",
      },
    },
    required: ['operation', 'explanation'],
  }
}

/** 1セクションを1行に要約（AIに渡すサイト構成の見取り図） */
function sectionHint(section: SiteSection): string {
  const p = section.props as Record<string, unknown>
  const hint =
    (typeof p.title === 'string' && p.title) ||
    (typeof p.siteName === 'string' && p.siteName) ||
    (typeof p.quote === 'string' && String(p.quote).slice(0, 20)) ||
    ''
  const style = section.style ? ` style=${JSON.stringify(section.style)}` : ''
  return `  - id:${section.id} ${section.component}${hint ? `「${hint}」` : ''}${style}`
}

export function buildEditContext(
  site: SiteData,
  request: string,
  selectedSectionId?: string,
): string {
  const outline = site.pages
    .map((page) => `ページ /${page.slug}（${page.title}）\n${page.sections.map(sectionHint).join('\n')}`)
    .join('\n')

  const fonts = resolveFonts(site.designTokens.typography)
  const tokensSummary = JSON.stringify({
    colors: site.designTokens.colors,
    fonts: { heading: fonts.headingId, body: fonts.bodyId },
    layout: site.designTokens.layout,
    decor: site.designTokens.decor,
  })

  const selected = findSection(site, selectedSectionId)
  const selectedText = selected
    ? `\n## ユーザーが画面上で選択中のセクション（特に指定がなければこれが対象）
id: ${selected.section.id} / component: ${selected.section.component}
props: ${JSON.stringify(selected.section.props)}
style: ${JSON.stringify(selected.section.style ?? {})}`
    : ''

  const assets = site.assets.length
    ? `\n## 利用できる写真素材\n${site.assets.map((a) => `- id:${a.id}［${a.kind}］${a.caption}`).join('\n')}`
    : ''

  return `## サイト構成（現在）
サイト名: ${site.brief.siteName}／トーン: ${site.brief.toneKeywords.join('、')}
${outline}

## 現在のデザイントークン
${tokensSummary}${selectedText}${assets}

## ユーザーの要求
${request}`
}

const STYLE_VOCABULARY = `
## 形容詞 → 操作の対応の目安
- 「高級感を」「上品に」→ patch_style（spacing:loose, align:left など）や set_tokens（明朝系フォント・headingLetterSpacing はフォント変更で代替・buttonShape:square・decor.headingAccent:rule）
- 「明るく」「親しみやすく」→ set_tokens（背景色を明るく・丸ゴシック系・buttonShape:pill・decor.imageTreatment:offset）
- 「もっと目立たせて」→ patch_style（headingScale:lg/xl, spacing:loose, background:tint）
- 「静かに」「控えめに」→ patch_style（spacing:tight, background:default）
- 「渋く」「和風に」→ set_tokens（preset:washoku-dark や shinise-warm、筆・明朝系フォント）`

export function buildEditSystemPrompt(): string {
  const catalogText = COMPONENT_CATALOG.map(
    (d) => `- ${d.component}（${d.category}）: ${d.use}`,
  ).join('\n')
  const fontsText = Object.entries(SITE_FONTS)
    .map(([id, f]) => `${id}=${f.vibe}`)
    .join(' / ')

  return `あなたはWebサイトの編集を行うディレクターです。
ユーザーの自然言語の要求を、edit_site ツールの「1つの最小操作」に変換してください。
サイト全体を作り直すことはできません。要求に関係ない部分は絶対に変えないでください。

## 操作の使い分け
- 文章・写真の変更 → patch_content（そのセクションの props 完成形を返す。変更しない項目は現在の値を維持）
- 見た目の調整（余白・背景・見出しの大きさ・揃え）→ patch_style（変更するキーだけ）
- サイト全体の雰囲気・色・フォント → set_tokens（変更する項目だけ）
- 同じ内容で別の見せ方 → replace_component（同カテゴリのコンポーネントへ。内容は引き継ぐ）
- 順番の変更 → reorder_sections（全セクションIDを新順序で。ヘッダー先頭・フッター末尾は固定）
- セクションの追加 → add_section / 削除 → remove_section
- 要求が曖昧・不可能・単なる質問 → none（explanation で丁寧に返答）

## ルール
- ヒアリングにない事実（住所・電話・価格・実績）を創作しない。既存の「（あとで入力）」は保持する
- 文章を書き直すときは元のトーンを守り、誇張語・絵文字を使わない
- 画像は素材一覧の id（source:"material"）か placeholder（intent に写真の内容）で指定する
${STYLE_VOCABULARY}

## 使えるコンポーネント
${catalogText}

## 使えるフォント
${fontsText}`
}
