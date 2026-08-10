// Design Tokens の preset と、Renderer / 静的書き出しが共有する CSS への変換。
// AI は preset を土台に色などを上書きするだけなので、壊れた配色になりにくい

import type { DesignTokens, FontPairingId, SectionStyle, SiteFontId } from '@/types/site'

export interface SiteFont {
  /** ユーザー向けの表示名 */
  label: string
  /** 分類（フォントピッカーのグルーピング用） */
  kind: '明朝' | 'アンティーク' | '筆・手書き' | 'ゴシック' | '丸ゴシック'
  /** CSS の font-family 値（フォールバック込み） */
  family: string
  /** Google Fonts css2 の family クエリ */
  google: string
  /** 本文向きか（長文の可読性）。false は見出し専用の推奨 */
  body: boolean
  /** AIに伝える雰囲気 */
  vibe: string
}

/** 厳選した日本語 Google Fonts。ここに追加するだけで AI schema・ピッカー・書き出しに反映される */
export const SITE_FONTS: Record<SiteFontId, SiteFont> = {
  'noto-serif': { label: 'Noto明朝', kind: '明朝', family: '"Noto Serif JP", "Hiragino Mincho ProN", serif', google: 'Noto+Serif+JP:wght@400;500;600;700', body: true, vibe: '端正で読みやすい標準的な明朝' },
  'shippori-mincho': { label: 'しっぽり明朝', kind: '明朝', family: '"Shippori Mincho", "Hiragino Mincho ProN", serif', google: 'Shippori+Mincho:wght@400;500;600;700', body: true, vibe: '上品で文学的。老舗・高級' },
  'zen-old-mincho': { label: 'Zenオールド明朝', kind: '明朝', family: '"Zen Old Mincho", "Hiragino Mincho ProN", serif', google: 'Zen+Old+Mincho:wght@400;500;700', body: true, vibe: '古風で凛とした明朝。旅館・工芸' },
  'kaisei-tokumin': { label: '解星 徳民', kind: '明朝', family: '"Kaisei Tokumin", "Hiragino Mincho ProN", serif', google: 'Kaisei+Tokumin:wght@400;500;700', body: true, vibe: '骨太で情の深い明朝。食・職人' },
  'kaisei-opti': { label: '解星 オプティ', kind: '明朝', family: '"Kaisei Opti", "Hiragino Mincho ProN", serif', google: 'Kaisei+Opti:wght@400;500;700', body: false, vibe: 'コントラストの強い個性的な明朝' },
  'zen-antique': { label: 'Zenアンティーク', kind: 'アンティーク', family: '"Zen Antique", "Hiragino Mincho ProN", serif', google: 'Zen+Antique', body: true, vibe: '活版印刷のような趣。レトロ・喫茶' },
  'shippori-antique': { label: 'しっぽりアンティーク', kind: 'アンティーク', family: '"Shippori Antique", "Hiragino Sans", sans-serif', google: 'Shippori+Antique', body: false, vibe: 'オールドスタイルのゴシック。昭和レトロ' },
  'yuji-syuku': { label: '佑字 肅', kind: '筆・手書き', family: '"Yuji Syuku", "Hiragino Mincho ProN", serif', google: 'Yuji+Syuku', body: false, vibe: '端正な筆文字。和・書道・格式' },
  'noto-sans': { label: 'Notoゴシック', kind: 'ゴシック', family: '"Noto Sans JP", "Hiragino Sans", sans-serif', google: 'Noto+Sans+JP:wght@400;500;700', body: true, vibe: '癖のない標準ゴシック。何にでも合う' },
  'zen-kaku-gothic': { label: 'Zen角ゴシック', kind: 'ゴシック', family: '"Zen Kaku Gothic New", "Hiragino Sans", sans-serif', google: 'Zen+Kaku+Gothic+New:wght@400;500;700', body: true, vibe: '柔らかく現代的なゴシック' },
  'biz-udgothic': { label: 'BIZ UDゴシック', kind: 'ゴシック', family: '"BIZ UDPGothic", "Hiragino Sans", sans-serif', google: 'BIZ+UDPGothic:wght@400;700', body: true, vibe: '読みやすさ特化。士業・公共・誠実' },
  'm-plus-1': { label: 'M PLUS 1', kind: 'ゴシック', family: '"M PLUS 1", "Hiragino Sans", sans-serif', google: 'M+PLUS+1:wght@400;500;700', body: true, vibe: 'ニュートラルでモダン' },
  'murecho': { label: 'ムレチョウ', kind: 'ゴシック', family: '"Murecho", "Hiragino Sans", sans-serif', google: 'Murecho:wght@400;500;700', body: true, vibe: '静かで洗練された印象' },
  'zen-maru-gothic': { label: 'Zen丸ゴシック', kind: '丸ゴシック', family: '"Zen Maru Gothic", "Hiragino Sans", sans-serif', google: 'Zen+Maru+Gothic:wght@400;500;700', body: true, vibe: '丸く親しみやすい。教室・サロン' },
  'm-plus-rounded': { label: 'M PLUS 丸', kind: '丸ゴシック', family: '"M PLUS Rounded 1c", "Hiragino Sans", sans-serif', google: 'M+PLUS+Rounded+1c:wght@400;500;700', body: true, vibe: 'ポップで元気な丸ゴシック' },
  'klee-one': { label: 'クレー', kind: '筆・手書き', family: '"Klee One", "Hiragino Sans", sans-serif', google: 'Klee+One:wght@400;600', body: true, vibe: '教科書のような手書き風。丁寧・素朴' },
  'kiwi-maru': { label: 'キウイ丸', kind: '丸ゴシック', family: '"Kiwi Maru", "Hiragino Sans", sans-serif', google: 'Kiwi+Maru:wght@300;400;500', body: true, vibe: 'レトロかわいい丸ゴシック' },
  'zen-kurenaido': { label: 'Zen紅道', kind: '筆・手書き', family: '"Zen Kurenaido", "Hiragino Sans", sans-serif', google: 'Zen+Kurenaido', body: false, vibe: 'ペン書きのような細い手書き風' },
}

export const SITE_FONT_IDS = Object.keys(SITE_FONTS) as SiteFontId[]

/** 本文に使える（可読性の高い）フォントID */
export const BODY_FONT_IDS = SITE_FONT_IDS.filter((id) => SITE_FONTS[id].body)

/** 旧5ペアリング → 新フォントIDの対応（保存済みデータの互換読み込み） */
const LEGACY_PAIRINGS: Record<FontPairingId, { heading: SiteFontId; body: SiteFontId }> = {
  'mincho-elegant': { heading: 'shippori-mincho', body: 'noto-sans' },
  'mincho-modern': { heading: 'zen-old-mincho', body: 'zen-kaku-gothic' },
  'gothic-clean': { heading: 'noto-sans', body: 'noto-sans' },
  'gothic-modern': { heading: 'zen-kaku-gothic', body: 'noto-sans' },
  'maru-friendly': { heading: 'zen-maru-gothic', body: 'noto-sans' },
}

/** typography から見出し・本文フォントを解決する。旧 fontPairing 形式も受ける */
export function resolveFonts(
  typography: Partial<DesignTokens['typography']> | undefined,
): { heading: SiteFont; headingId: SiteFontId; body: SiteFont; bodyId: SiteFontId } {
  let headingId = typography?.headingFont
  let bodyId = typography?.bodyFont
  if ((!headingId || !bodyId) && typography?.fontPairing) {
    const legacy = LEGACY_PAIRINGS[typography.fontPairing]
    headingId = headingId ?? legacy?.heading
    bodyId = bodyId ?? legacy?.body
  }
  if (!headingId || !SITE_FONTS[headingId]) headingId = 'noto-sans'
  if (!bodyId || !SITE_FONTS[bodyId]) bodyId = 'noto-sans'
  return { headingId, bodyId, heading: SITE_FONTS[headingId], body: SITE_FONTS[bodyId] }
}

export function googleFontsHrefFor(...fontIds: SiteFontId[]): string {
  const families = [...new Set(fontIds.map((id) => SITE_FONTS[id].google))]
    .map((f) => `family=${f}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/** サイト（tokens）が使うフォントの Google Fonts URL */
export function googleFontsHref(tokens: DesignTokens): string {
  const fonts = resolveFonts(tokens.typography)
  return googleFontsHrefFor(fonts.headingId, fonts.bodyId)
}

export type TokenPresetId =
  | 'shinise-warm'
  | 'washoku-dark'
  | 'craft-natural'
  | 'trust-blue'
  | 'salon-soft'

/** AIが土台として選ぶ preset。業種・トーンに合わせた完成度の高い組み合わせ */
export const TOKEN_PRESETS: Record<TokenPresetId, DesignTokens> = {
  // 老舗・和菓子・茶・工芸：生成りの紙に深緑
  'shinise-warm': {
    colors: {
      primary: '#3d5a40',
      background: '#faf7f0',
      surface: '#f1ece0',
      text: '#2b2a26',
      mutedText: '#6f6a5e',
      onPrimary: '#faf7f0',
      line: '#ddd6c7',
      accent: '#a8632c',
    },
    typography: { headingFont: 'shippori-mincho', bodyFont: 'noto-sans', headingLetterSpacing: 'wide', headingWeight: 600 },
    layout: { sectionSpacing: 'spacious', containerWidth: 'normal' },
    radius: { button: 'square', card: 'none', image: 'none' },
    shadow: 'none',
    decor: { headingAccent: 'rule', imageTreatment: 'frame', sectionDivider: 'none', motion: 'rise' },
  },
  // 飲食・夜営業・旅館：墨色に金茶
  'washoku-dark': {
    colors: {
      primary: '#b08d57',
      background: '#191714',
      surface: '#232019',
      text: '#ece7dd',
      mutedText: '#a39c8d',
      onPrimary: '#191714',
      line: '#3a352c',
      accent: '#b08d57',
    },
    typography: { headingFont: 'zen-old-mincho', bodyFont: 'zen-kaku-gothic', headingLetterSpacing: 'wide', headingWeight: 500 },
    layout: { sectionSpacing: 'spacious', containerWidth: 'normal' },
    radius: { button: 'square', card: 'sm', image: 'sm' },
    shadow: 'none',
    decor: { headingAccent: 'bar', imageTreatment: 'plain', sectionDivider: 'none', motion: 'rise' },
  },
  // 食品生産・農園・パン：温かいナチュラル
  'craft-natural': {
    colors: {
      primary: '#7a4a2b',
      background: '#fffdf8',
      surface: '#f6efe3',
      text: '#3a2f25',
      mutedText: '#8a7a68',
      onPrimary: '#fffdf8',
      line: '#e7dcc9',
      accent: '#4a7a52',
    },
    typography: { headingFont: 'zen-kaku-gothic', bodyFont: 'noto-sans', headingLetterSpacing: 'normal', headingWeight: 700 },
    layout: { sectionSpacing: 'normal', containerWidth: 'normal' },
    radius: { button: 'rounded', card: 'md', image: 'md' },
    shadow: 'soft',
    decor: { headingAccent: 'underline', imageTreatment: 'offset', sectionDivider: 'none', motion: 'rise' },
  },
  // 士業・製造・専門サービス：信頼の紺
  'trust-blue': {
    colors: {
      primary: '#1f3a5f',
      background: '#ffffff',
      surface: '#f2f5f9',
      text: '#1c2430',
      mutedText: '#5d6b7d',
      onPrimary: '#ffffff',
      line: '#dbe2ea',
      accent: '#b08d57',
    },
    typography: { headingFont: 'noto-sans', bodyFont: 'noto-sans', headingLetterSpacing: 'normal', headingWeight: 700 },
    layout: { sectionSpacing: 'normal', containerWidth: 'normal' },
    radius: { button: 'rounded', card: 'sm', image: 'sm' },
    shadow: 'soft',
    decor: { headingAccent: 'bar', imageTreatment: 'plain', sectionDivider: 'line', motion: 'none' },
  },
  // 美容・教室・サロン：柔らかい淡色
  'salon-soft': {
    colors: {
      primary: '#8c6a5d',
      background: '#fdfaf7',
      surface: '#f5ece6',
      text: '#453b35',
      mutedText: '#96877e',
      onPrimary: '#fdfaf7',
      line: '#e9ddd4',
      accent: '#b5836d',
    },
    typography: { headingFont: 'zen-maru-gothic', bodyFont: 'noto-sans', headingLetterSpacing: 'normal', headingWeight: 700 },
    layout: { sectionSpacing: 'normal', containerWidth: 'narrow' },
    radius: { button: 'pill', card: 'lg', image: 'lg' },
    shadow: 'soft',
    decor: { headingAccent: 'none', imageTreatment: 'plain', sectionDivider: 'none', motion: 'rise' },
  },
}

export const DEFAULT_TOKENS: DesignTokens = TOKEN_PRESETS['trust-blue']

const SECTION_SPACING_CSS = {
  compact: 'clamp(3rem, 6vw, 4.5rem)',
  normal: 'clamp(4rem, 8vw, 6.5rem)',
  spacious: 'clamp(5rem, 10vw, 8.5rem)',
} as const

const CONTAINER_CSS = { narrow: '58rem', normal: '68rem', wide: '78rem' } as const

const RADIUS_CSS = { none: '0px', sm: '0.375rem', md: '0.75rem', lg: '1.25rem' } as const

const BUTTON_RADIUS_CSS = { square: '2px', rounded: '0.5rem', pill: '999px' } as const

const SHADOW_CSS = {
  none: 'none',
  soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06)',
  medium: '0 2px 4px rgb(0 0 0 / 0.06), 0 12px 32px rgb(0 0 0 / 0.12)',
} as const

/** トークンを CSS カスタムプロパティへ。サイトのルート要素の style に渡す */
export function tokensToCssVars(t: DesignTokens): Record<string, string> {
  const fonts = resolveFonts(t.typography)
  return {
    '--s-primary': t.colors.primary,
    '--s-bg': t.colors.background,
    '--s-surface': t.colors.surface,
    '--s-text': t.colors.text,
    '--s-muted': t.colors.mutedText,
    '--s-on-primary': t.colors.onPrimary,
    '--s-line': t.colors.line,
    '--s-accent': t.colors.accent,
    '--s-heading-font': fonts.heading.family,
    '--s-body-font': fonts.body.family,
    '--s-heading-weight': String(t.typography.headingWeight),
    '--s-heading-ls': t.typography.headingLetterSpacing === 'wide' ? '0.08em' : '0.01em',
    '--s-section-y': SECTION_SPACING_CSS[t.layout.sectionSpacing],
    '--s-container': CONTAINER_CSS[t.layout.containerWidth],
    '--s-radius-btn': BUTTON_RADIUS_CSS[t.radius.button],
    '--s-radius-card': RADIUS_CSS[t.radius.card],
    '--s-radius-img': RADIUS_CSS[t.radius.image],
    '--s-shadow-card': SHADOW_CSS[t.shadow],
    // 元の色の凍結コピー。data-sbg="primary" での色再割り当てから参照する
    '--s-bg0': t.colors.background,
    '--s-text0': t.colors.text,
    '--s-primary0': t.colors.primary,
    '--s-on-primary0': t.colors.onPrimary,
  }
}

/** decor トークンをルート要素の data 属性へ（SITE_BASE_CSS のルールが反応する） */
export function rootDecorAttrs(t: DesignTokens): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (t.decor.headingAccent !== 'none') attrs['data-ha'] = t.decor.headingAccent
  if (t.decor.imageTreatment !== 'plain') attrs['data-imgt'] = t.decor.imageTreatment
  if (t.decor.sectionDivider !== 'none') attrs['data-sd'] = t.decor.sectionDivider
  return attrs
}

/**
 * セクション単位のスタイル上書き（SectionStyle）を、Renderer がラッパー要素へ
 * 付ける data 属性と CSS 変数上書きへ変換する。すべて token 範囲内なので安全
 */
export function sectionWrapperProps(
  style: SectionStyle | undefined,
  tokens: DesignTokens,
): { attrs: Record<string, string>; vars: Record<string, string> } {
  const attrs: Record<string, string> = {}
  const vars: Record<string, string> = {}

  if (style?.background) attrs['data-sbg'] = style.background
  if (style?.align) attrs['data-align'] = style.align
  if (style?.headingScale && style.headingScale !== 'md') attrs['data-hscale'] = style.headingScale
  if (style?.imageRatio) attrs['data-imgratio'] = style.imageRatio
  if (style?.divider && style.divider !== 'none') attrs['data-divider'] = style.divider

  const motion =
    !style?.motion || style.motion === 'inherit' ? tokens.decor.motion : style.motion
  if (motion === 'rise') attrs['data-motion'] = 'rise'

  if (style?.spacing) {
    const map = { tight: 'compact', normal: 'normal', loose: 'spacious' } as const
    vars['--s-section-y'] = SECTION_SPACING_CSS[map[style.spacing]]
  }
  if (style?.containerWidth) vars['--s-container'] = CONTAINER_CSS[style.containerWidth]

  return { attrs, vars }
}

/**
 * Renderer と静的書き出しが共有するベースCSS。
 * Tailwind ではレイアウトのみ組み、書体・色の基調はここで統一する
 */
export const SITE_BASE_CSS = `
.site-root {
  background: var(--s-bg);
  color: var(--s-text);
  font-family: var(--s-body-font);
  line-height: 1.9;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.site-root h1, .site-root h2, .site-root h3, .site-root h4 {
  font-family: var(--s-heading-font);
  font-weight: var(--s-heading-weight);
  letter-spacing: var(--s-heading-ls);
  line-height: 1.4;
  text-wrap: balance;
}
.site-root img { max-width: 100%; display: block; }
.site-root a { color: inherit; }
.site-root details > summary { list-style: none; cursor: pointer; }
.site-root details > summary::-webkit-details-marker { display: none; }

/* ── decor: 見出しのあしらい（ルートの data-ha に反応） ── */
.site-root[data-ha="bar"] .s-heading h2::after {
  content: ''; display: block; width: 2.75rem; height: 3px;
  background: var(--s-accent); margin: 1rem auto 0;
}
.site-root[data-ha="bar"] .s-heading-left h2::after { margin-inline: 0; }
.site-root[data-ha="rule"] .s-heading h2::before {
  content: ''; display: block; width: 1px; height: 2.2rem;
  background: var(--s-accent); margin: 0 auto 1.1rem;
}
.site-root[data-ha="rule"] .s-heading-left h2::before { margin-inline: 0; }
.site-root[data-ha="underline"] .s-heading h2 {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--s-accent) 40%, transparent);
  text-decoration-thickness: 0.3rem;
  text-underline-offset: 0.45rem;
}

/* ── decor: 写真の見せ方（ルートの data-imgt に反応） ── */
.site-root .s-img { box-shadow: var(--s-shadow-card); }
.site-root[data-imgt="frame"] .s-img {
  border: 1px solid var(--s-line); padding: 0.45rem;
  background: var(--s-bg); box-shadow: none;
}
.site-root[data-imgt="offset"] .s-img {
  box-shadow: 10px 10px 0 color-mix(in srgb, var(--s-primary) 16%, transparent);
}

/* ── decor: セクション区切り（ルートの data-sd に反応） ── */
.site-root[data-sd="line"] [data-sid] + [data-sid] > section {
  border-top: 1px solid var(--s-line);
}

/* ── Style Props: セクション単位の上書き（ラッパーの data-* に反応） ── */
[data-sbg="default"] > section { background: transparent; }
[data-sbg="surface"] > section { background: var(--s-surface); }
[data-sbg="tint"] > section {
  background: color-mix(in srgb, var(--s-primary) 6%, var(--s-bg));
}
[data-sbg="primary"] {
  --s-text: var(--s-on-primary0);
  --s-muted: color-mix(in srgb, var(--s-on-primary0) 78%, transparent);
  --s-accent: var(--s-on-primary0);
  --s-line: color-mix(in srgb, var(--s-on-primary0) 28%, transparent);
  --s-surface: color-mix(in srgb, var(--s-on-primary0) 10%, transparent);
  --s-primary: var(--s-bg0);
  --s-on-primary: var(--s-text0);
  --s-shadow-card: none;
}
[data-sbg="primary"] > section {
  background: var(--s-primary0);
  color: var(--s-on-primary0);
}
[data-align="left"] .s-heading { text-align: left; align-items: flex-start; }
[data-align="center"] .s-heading { text-align: center; align-items: center; }
[data-hscale="lg"] .s-heading h2 { font-size: 2.6rem; }
[data-hscale="xl"] .s-heading h2 { font-size: 3.2rem; }
@media (max-width: 640px) {
  [data-hscale="lg"] .s-heading h2 { font-size: 2rem; }
  [data-hscale="xl"] .s-heading h2 { font-size: 2.35rem; }
}
[data-imgratio="1/1"] .s-img { aspect-ratio: 1 / 1 !important; }
[data-imgratio="4/3"] .s-img { aspect-ratio: 4 / 3 !important; }
[data-imgratio="3/2"] .s-img { aspect-ratio: 3 / 2 !important; }
[data-imgratio="16/9"] .s-img { aspect-ratio: 16 / 9 !important; }
[data-imgratio="3/4"] .s-img { aspect-ratio: 3 / 4 !important; }
[data-divider="top"] > section { border-top: 1px solid var(--s-line); }
[data-divider="bottom"] > section { border-bottom: 1px solid var(--s-line); }

/* ── motion: スクロール入場（対応ブラウザのみ。reduced-motion 尊重） ── */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-motion="rise"] > section > * {
      animation: s-rise 0.7s ease-out both;
      animation-timeline: view();
      animation-range: entry 0% entry 45%;
    }
  }
}
@keyframes s-rise {
  from { opacity: 0; transform: translateY(1.25rem); }
  to { opacity: 1; transform: none; }
}
`
