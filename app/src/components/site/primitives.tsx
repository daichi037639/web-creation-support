// Component Library 共有プリミティブ。
// hooks・context を使わない（client プレビューと server 静的書き出しの両方で
// そのまま render できることを保証するため）

import type { ReactNode } from 'react'
import type { AssetReference, CtaLink } from '@/types/site'

// ───────────────────────── layout

export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[var(--s-container)] px-5 sm:px-8 ${className}`}
    >
      {children}
    </div>
  )
}

export type SectionBg = 'default' | 'surface' | 'primary'

const SECTION_BG: Record<SectionBg, string> = {
  default: '',
  surface: 'bg-[var(--s-surface)]',
  primary: 'bg-[var(--s-primary)] text-[var(--s-on-primary)]',
}

/** 全セクション共通ラッパー。stable ID とカテゴリアンカーを持つ */
export function Section({
  sectionId,
  category,
  bg = 'default',
  padded = true,
  children,
  className = '',
}: {
  sectionId: string
  category: string
  bg?: SectionBg
  padded?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={sectionId}
      data-section-id={sectionId}
      data-category={category}
      className={`relative ${SECTION_BG[bg]} ${className}`}
      style={padded ? { paddingBlock: 'var(--s-section-y)' } : undefined}
    >
      {/* "#contact" のようなカテゴリ名アンカーへのリンクを成立させる */}
      <span id={category} className="absolute -top-16" aria-hidden />
      {children}
    </section>
  )
}

// ───────────────────────── typography

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  onDark = false,
}: {
  eyebrow?: string
  title?: string
  description?: string
  align?: 'left' | 'center'
  onDark?: boolean
}) {
  if (!eyebrow && !title && !description) return null
  const alignCls =
    align === 'center'
      ? 'text-center items-center s-heading'
      : 'text-left items-start s-heading s-heading-left'
  return (
    <div className={`mb-12 flex flex-col gap-3 sm:mb-16 ${alignCls}`}>
      {eyebrow && (
        <p
          className={`text-xs font-semibold tracking-[0.25em] ${
            onDark ? 'opacity-80' : 'text-[var(--s-accent)]'
          }`}
        >
          {eyebrow}
        </p>
      )}
      {title && <h2 className="text-2xl sm:text-3xl md:text-[2.15rem]">{title}</h2>}
      {description && (
        <p
          className={`max-w-xl text-sm leading-loose sm:text-base ${
            onDark ? 'opacity-80' : 'text-[var(--s-muted)]'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}

// ───────────────────────── buttons

export function CtaButton({
  cta,
  variant = 'primary',
  onDark = false,
}: {
  cta?: CtaLink
  variant?: 'primary' | 'ghost'
  onDark?: boolean
}) {
  if (!cta) return null
  const base =
    'inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-medium tracking-wide transition-opacity hover:opacity-80'
  // 色は inline style で確定させる（セクション側の文字色ユーティリティと
  // 任意値クラスの優先順位が不定なため、クラスでは上書きが保証できない）
  const styles: React.CSSProperties =
    variant === 'primary'
      ? onDark
        ? { background: 'var(--s-bg)', color: 'var(--s-text)' }
        : { background: 'var(--s-primary)', color: 'var(--s-on-primary)' }
      : onDark
        ? { border: '1px solid color-mix(in srgb, currentColor 45%, transparent)' }
        : { border: '1px solid var(--s-line)', color: 'var(--s-text)' }
  return (
    <a
      href={cta.href}
      className={base}
      style={{ borderRadius: 'var(--s-radius-btn)', ...styles }}
    >
      {cta.label}
      <span aria-hidden className="text-xs">→</span>
    </a>
  )
}

// ───────────────────────── images

const RATIO_CSS: Record<string, string> = {
  '1/1': '1 / 1',
  '4/3': '4 / 3',
  '3/2': '3 / 2',
  '16/9': '16 / 9',
  '3/4': '3 / 4',
}

/**
 * AssetReference を描画する。material は SiteRenderer が url 型へ解決済み。
 * placeholder でもレイアウトが崩れず、むしろ意図的に見えるデザインにする
 */
export function SmartImage({
  image,
  className = '',
  rounded = true,
  fill = false,
  fallbackRatio = '4/3',
}: {
  image?: AssetReference
  className?: string
  rounded?: boolean
  /** 親要素いっぱいに広げる（HeroFullBleed 用） */
  fill?: boolean
  fallbackRatio?: '1/1' | '4/3' | '3/2' | '16/9' | '3/4'
}) {
  const radius = rounded && !fill ? { borderRadius: 'var(--s-radius-img)' } : undefined

  if (image && image.type === 'url') {
    return (
      // 静的HTMLとして書き出すサイトなので next/image は使えない
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={image.alt ?? ''}
        loading="lazy"
        className={`${fill ? 'absolute inset-0 h-full w-full' : 's-img w-full'} object-cover ${className}`}
        style={{
          ...radius,
          ...(fill ? undefined : { aspectRatio: RATIO_CSS[fallbackRatio] }),
        }}
      />
    )
  }

  const ratio = image?.type === 'placeholder' ? image.aspectRatio : fallbackRatio
  const intent = image?.type === 'placeholder' ? image.intent : '写真'
  return (
    <div
      className={`${fill ? 'absolute inset-0 h-full w-full' : 's-img relative w-full'} overflow-hidden ${className}`}
      style={{
        ...radius,
        ...(fill ? undefined : { aspectRatio: RATIO_CSS[ratio] }),
        background:
          'linear-gradient(135deg, var(--s-surface) 0%, color-mix(in srgb, var(--s-primary) 12%, var(--s-surface)) 100%)',
      }}
      role="img"
      aria-label={intent}
    >
      {/* 細い斜線パターンで「準備中の枠」を上品に見せる */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, color-mix(in srgb, var(--s-text) 6%, transparent) 10px, color-mix(in srgb, var(--s-text) 6%, transparent) 11px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <p
          className="max-w-[16em] text-center text-[11px] leading-relaxed tracking-wide"
          style={{ color: 'color-mix(in srgb, var(--s-text) 45%, transparent)' }}
        >
          <span aria-hidden className="mb-1 block text-base">▢</span>
          {intent}
        </p>
      </div>
    </div>
  )
}

// ───────────────────────── icons

const ICON_PATHS: Record<string, ReactNode> = {
  leaf: (
    <path d="M6 20c8 0 13-5 13-14-9 0-14 5-14 13 0 .34.01.67.04 1H6zm0 0c2-6 6-10 11-12" />
  ),
  star: <path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8L12 3z" />,
  heart: <path d="M12 20s-7.5-4.7-9.3-9C1.4 7.5 3.6 4.5 6.8 4.5c2 0 3.7 1.1 4.5 2.8h1.4c.8-1.7 2.5-2.8 4.5-2.8 3.2 0 5.4 3 4.1 6.5-1.8 4.3-9.3 9-9.3 9z" />,
  shield: <path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  gem: <path d="M6 4h12l3 5-9 11L3 9l3-5zm-3 5h18M9.5 4L8 9l4 11M14.5 4L16 9l-4 11" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M17.5 14.7c2.2.7 3.6 2.5 4 5.3" />
    </>
  ),
  flame: <path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-2.6 1.6-4.5 3-6.3.4 1 1 1.9 2 2.4C10.6 8 11.5 5 14 3c-.3 2.3.6 3.6 1.9 5.2 1.2 1.5 2.6 3.2 2.6 6.1 0 3.7-2.5 6.7-6.5 6.7z" />,
}

export function FeatureIcon({ name }: { name?: string }) {
  const path = ICON_PATHS[name ?? ''] ?? ICON_PATHS.star
  return (
    <span
      className="inline-flex h-12 w-12 items-center justify-center"
      style={{
        borderRadius: 'var(--s-radius-card)',
        background: 'color-mix(in srgb, var(--s-primary) 10%, transparent)',
        color: 'var(--s-primary)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {path}
      </svg>
    </span>
  )
}

// ───────────────────────── nav

export interface NavItem {
  label: string
  href: string
}

export function NavLinks({ nav, className = '' }: { nav?: NavItem[]; className?: string }) {
  if (!nav || nav.length === 0) return null
  return (
    <nav className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {nav.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="text-[13px] tracking-wider no-underline transition-opacity hover:opacity-60"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
