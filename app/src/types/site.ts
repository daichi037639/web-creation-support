// 生成サイトの canonical state。
// AI生成・Renderer・Preview・（将来の）Visual Editor / 部分編集がすべてこの型を扱う。
// 文章ベースの DesignBrief（types/wizard.ts）と違い、機械可読な構造化データを source of truth とする

/**
 * 厳選した日本語 Google Fonts の ID（実体は lib/site/tokens.ts の SITE_FONTS）。
 * 見出し・本文を別々に選べる。リスト内ならどう組み合わせても品質が保たれる
 */
export type SiteFontId =
  | 'noto-serif'
  | 'shippori-mincho'
  | 'zen-old-mincho'
  | 'kaisei-tokumin'
  | 'kaisei-opti'
  | 'zen-antique'
  | 'shippori-antique'
  | 'yuji-syuku'
  | 'noto-sans'
  | 'zen-kaku-gothic'
  | 'biz-udgothic'
  | 'm-plus-1'
  | 'murecho'
  | 'zen-maru-gothic'
  | 'm-plus-rounded'
  | 'klee-one'
  | 'kiwi-maru'
  | 'zen-kurenaido'

/** @deprecated 旧5ペアリング。保存済みデータ互換のため型だけ残す（tokens.ts が変換する） */
export type FontPairingId =
  | 'mincho-elegant'
  | 'mincho-modern'
  | 'gothic-clean'
  | 'gothic-modern'
  | 'maru-friendly'

export type SectionSpacing = 'compact' | 'normal' | 'spacious'
export type ContainerWidth = 'narrow' | 'normal' | 'wide'
export type RadiusScale = 'none' | 'sm' | 'md' | 'lg'
export type ButtonShape = 'square' | 'rounded' | 'pill'
export type ShadowScale = 'none' | 'soft' | 'medium'

export interface DesignTokens {
  colors: {
    /** メインカラー。見出しの差し色・ボタン背景 */
    primary: string
    /** ページ背景 */
    background: string
    /** カード・交互セクションの背景 */
    surface: string
    /** 本文テキスト */
    text: string
    /** 補足テキスト */
    mutedText: string
    /** primary の上に載せる文字色 */
    onPrimary: string
    /** 罫線 */
    line: string
    /** 強調・アクセント（バッジ、リンク等）。未指定は primary を使う */
    accent: string
  }
  typography: {
    /** 見出し用フォント */
    headingFont: SiteFontId
    /** 本文用フォント（可読性の高いフォントのみ推奨） */
    bodyFont: SiteFontId
    /** 見出しの字間。和風・高級は wide が合う */
    headingLetterSpacing: 'normal' | 'wide'
    headingWeight: 500 | 600 | 700
    /** @deprecated 旧形式。保存済みサイトの互換読み込み用 */
    fontPairing?: FontPairingId
  }
  layout: {
    sectionSpacing: SectionSpacing
    containerWidth: ContainerWidth
  }
  radius: {
    button: ButtonShape
    card: RadiusScale
    image: RadiusScale
  }
  shadow: ShadowScale
  /** 装飾の人格（LOG-013 Layer 0）。同じコンポーネント構成でもサイトの個性を分ける */
  decor: {
    /** 見出しまわりのあしらい */
    headingAccent: 'none' | 'bar' | 'rule' | 'underline'
    /** 写真の見せ方 */
    imageTreatment: 'plain' | 'frame' | 'offset'
    /** セクション間の区切り */
    sectionDivider: 'none' | 'line'
    /** スクロール時の入場モーション（CSSのみ・非対応ブラウザでは無効） */
    motion: 'none' | 'rise'
  }
}

/**
 * セクション単位のスタイル上書き（LOG-013 Layer 1）。
 * すべて Design Tokens の範囲内の enum なので、どう組み合わせても
 * レスポンシブ・コントラストが壊れない。AI編集・Puck の fields の対象
 */
export interface SectionStyle {
  /** 背景。tint はメインカラーの薄敷き */
  background?: 'default' | 'surface' | 'primary' | 'tint'
  /** セクションの上下余白 */
  spacing?: 'tight' | 'normal' | 'loose'
  /** 見出しブロックの揃え */
  align?: 'left' | 'center'
  /** コンテンツ幅の上書き */
  containerWidth?: ContainerWidth
  /** セクション見出しの大きさ */
  headingScale?: 'md' | 'lg' | 'xl'
  /** セクション内の画像の縦横比の上書き */
  imageRatio?: '1/1' | '4/3' | '3/2' | '16/9' | '3/4'
  /** 罫線の区切り */
  divider?: 'none' | 'top' | 'bottom'
  /** 入場モーションの上書き */
  motion?: 'inherit' | 'none' | 'rise'
}

/**
 * 画像参照。実素材（Supabase Storage のURL）／外部URL／プレースホルダーを
 * 同じ型で扱う。画像が無くてもセクションが崩れない設計の要
 */
export type AssetReference =
  | { type: 'material'; id: string }
  | { type: 'url'; url: string; alt?: string }
  | {
      type: 'placeholder'
      aspectRatio: '1/1' | '4/3' | '3/2' | '16/9' | '3/4'
      /** 推奨する画像の内容（例：職人が商品を作っている様子）。ユーザーへの提案にもなる */
      intent: string
    }

export interface SiteAsset {
  id: string
  url: string
  kind: string
  caption: string
}

export interface CtaLink {
  label: string
  /** '#section-id' | 'tel:' | 'mailto:' | 'https://' | '/slug' */
  href: string
}

export interface SiteSection {
  /** stable ID。クリック編集・部分修正・並び替えの対象キー */
  id: string
  /** Component Library のコンポーネント名（例：HeroSplit） */
  component: string
  props: Record<string, unknown>
  /** セクション単位のスタイル上書き。未指定はコンポーネント既定のまま */
  style?: SectionStyle
}

export interface SitePage {
  id: string
  /** 'home' | 'products' 等。ナビゲーションのリンク先になる */
  slug: string
  title: string
  sections: SiteSection[]
}

export interface SiteBrief {
  siteName: string
  tagline: string
  industry: string
  audience: string
  toneKeywords: string[]
  keyMessages: string[]
}

export interface SiteData {
  version: 1
  brief: SiteBrief
  designTokens: DesignTokens
  pages: SitePage[]
  /** アップロード済み実素材。AssetReference {type:'material'} の解決先 */
  assets: SiteAsset[]
}
