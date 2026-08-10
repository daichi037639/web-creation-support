// Component Library 本体（12カテゴリ・27コンポーネント）。
// props の形は lib/site/catalog.ts の schema が単一情報源。
// hooks を使わない（プレビューと静的書き出しの両方で render するため）

import type { AssetReference, CtaLink } from '@/types/site'
import {
  Container,
  CtaButton,
  FeatureIcon,
  NavLinks,
  Section,
  SectionHeading,
  SmartImage,
  type NavItem,
} from '@/components/site/primitives'

type Base = { sectionId: string }

// ───────────────────────────────────────────── Header

export function HeaderSimple({
  sectionId,
  siteName,
  tagline,
  nav,
}: Base & { siteName?: string; tagline?: string; nav?: NavItem[] }) {
  return (
    <Section sectionId={sectionId} category="header" padded={false} className="border-b border-[var(--s-line)]">
      <Container className="flex flex-col items-center gap-3 py-5 sm:flex-row sm:justify-between">
        <div className="flex items-baseline gap-3">
          <p className="text-lg" style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 'var(--s-heading-weight)' as never, letterSpacing: 'var(--s-heading-ls)' }}>
            {siteName}
          </p>
          {tagline && <p className="hidden text-xs text-[var(--s-muted)] sm:block">{tagline}</p>}
        </div>
        <NavLinks nav={nav} />
      </Container>
    </Section>
  )
}

export function HeaderCentered({
  sectionId,
  siteName,
  tagline,
  nav,
}: Base & { siteName?: string; tagline?: string; nav?: NavItem[] }) {
  return (
    <Section sectionId={sectionId} category="header" padded={false} className="border-b border-[var(--s-line)]">
      <Container className="flex flex-col items-center gap-3 py-7">
        {tagline && (
          <p className="text-[11px] tracking-[0.3em] text-[var(--s-muted)]">{tagline}</p>
        )}
        <p className="text-2xl" style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 'var(--s-heading-weight)' as never, letterSpacing: 'var(--s-heading-ls)' }}>
          {siteName}
        </p>
        <NavLinks nav={nav} className="mt-1" />
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Hero

export function HeroCentered({
  sectionId,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: Base & {
  eyebrow?: string
  title?: string
  description?: string
  primaryCta?: CtaLink
  secondaryCta?: CtaLink
}) {
  return (
    <Section sectionId={sectionId} category="hero">
      <Container className="flex flex-col items-center gap-6 text-center">
        {eyebrow && (
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-[var(--s-accent)]">
            <span className="inline-block h-px w-6 bg-current" aria-hidden />
            {eyebrow}
            <span className="inline-block h-px w-6 bg-current" aria-hidden />
          </p>
        )}
        <h1 className="max-w-3xl text-3xl leading-snug sm:text-4xl md:text-5xl md:leading-snug">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm leading-loose text-[var(--s-muted)] sm:text-base">
            {description}
          </p>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <CtaButton cta={primaryCta} />
            <CtaButton cta={secondaryCta} variant="ghost" />
          </div>
        )}
      </Container>
    </Section>
  )
}

export function HeroSplit({
  sectionId,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  image,
  imagePosition = 'right',
}: Base & {
  eyebrow?: string
  title?: string
  description?: string
  primaryCta?: CtaLink
  secondaryCta?: CtaLink
  image?: AssetReference
  imagePosition?: 'left' | 'right'
}) {
  return (
    <Section sectionId={sectionId} category="hero">
      <Container>
        <div
          className={`grid items-center gap-10 md:grid-cols-2 md:gap-14 ${
            imagePosition === 'left' ? 'md:[direction:rtl]' : ''
          }`}
        >
          <div className="flex flex-col items-start gap-5 md:[direction:ltr]">
            {eyebrow && (
              <p className="text-xs font-semibold tracking-[0.3em] text-[var(--s-accent)]">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl leading-snug sm:text-4xl md:text-[2.75rem] md:leading-snug">
              {title}
            </h1>
            {description && (
              <p className="text-sm leading-loose text-[var(--s-muted)] sm:text-base">
                {description}
              </p>
            )}
            {(primaryCta || secondaryCta) && (
              <div className="mt-1 flex flex-wrap gap-3">
                <CtaButton cta={primaryCta} />
                <CtaButton cta={secondaryCta} variant="ghost" />
              </div>
            )}
          </div>
          <div className="md:[direction:ltr]">
            <SmartImage image={image} fallbackRatio="3/2" />
          </div>
        </div>
      </Container>
    </Section>
  )
}

export function HeroFullBleed({
  sectionId,
  eyebrow,
  title,
  description,
  primaryCta,
  image,
}: Base & {
  eyebrow?: string
  title?: string
  description?: string
  primaryCta?: CtaLink
  image?: AssetReference
}) {
  return (
    <Section sectionId={sectionId} category="hero" padded={false} className="overflow-hidden">
      <div className="relative flex min-h-[70vh] items-center justify-center py-24">
        <SmartImage image={image} fill fallbackRatio="16/9" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25" aria-hidden />
        <Container className="relative z-10 flex flex-col items-center gap-6 text-center text-white">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-[0.35em] opacity-90">{eyebrow}</p>
          )}
          <h1 className="max-w-3xl text-3xl leading-snug drop-shadow sm:text-4xl md:text-5xl md:leading-snug">
            {title}
          </h1>
          {description && (
            <p className="max-w-xl text-sm leading-loose opacity-90 sm:text-base">{description}</p>
          )}
          {primaryCta && (
            <div className="mt-2">
              <CtaButton cta={primaryCta} />
            </div>
          )}
        </Container>
      </div>
    </Section>
  )
}

export function HeroMinimal({
  sectionId,
  title,
  description,
}: Base & { title?: string; description?: string }) {
  return (
    <Section sectionId={sectionId} category="hero" className="py-8">
      <Container className="flex min-h-[38vh] flex-col items-start justify-center gap-6">
        <span className="inline-block h-px w-14 bg-[var(--s-accent)]" aria-hidden />
        <h1 className="max-w-2xl text-3xl leading-relaxed sm:text-4xl sm:leading-relaxed">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm leading-loose text-[var(--s-muted)] sm:text-base">
            {description}
          </p>
        )}
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Story

function StorySplit({
  sectionId,
  eyebrow,
  title,
  body,
  image,
  cta,
  imageLeft,
}: Base & {
  eyebrow?: string
  title?: string
  body?: string
  image?: AssetReference
  cta?: CtaLink
  imageLeft: boolean
}) {
  return (
    <Section sectionId={sectionId} category="story" bg="surface">
      <Container>
        <div className={`grid items-center gap-10 md:grid-cols-5 md:gap-16`}>
          <div className={`md:col-span-2 ${imageLeft ? '' : 'md:order-2'}`}>
            <SmartImage image={image} fallbackRatio="3/4" />
          </div>
          <div className={`flex flex-col items-start gap-5 md:col-span-3 ${imageLeft ? '' : 'md:order-1'}`}>
            {eyebrow && (
              <p className="text-xs font-semibold tracking-[0.3em] text-[var(--s-accent)]">{eyebrow}</p>
            )}
            <h2 className="text-2xl sm:text-3xl">{title}</h2>
            <p className="whitespace-pre-line text-sm leading-[2.1] text-[var(--s-muted)] sm:text-[15px]">
              {body}
            </p>
            {cta && <CtaButton cta={cta} variant="ghost" />}
          </div>
        </div>
      </Container>
    </Section>
  )
}

export function StoryImageLeft(props: Base & Record<string, unknown>) {
  return <StorySplit {...(props as Parameters<typeof StorySplit>[0])} imageLeft />
}

export function StoryImageRight(props: Base & Record<string, unknown>) {
  return <StorySplit {...(props as Parameters<typeof StorySplit>[0])} imageLeft={false} />
}

export function StoryEditorial({
  sectionId,
  eyebrow,
  title,
  lead,
  body,
  quote,
}: Base & { eyebrow?: string; title?: string; lead?: string; body?: string; quote?: string }) {
  return (
    <Section sectionId={sectionId} category="story">
      <Container className="max-w-[46rem]">
        <div className="flex flex-col gap-7">
          <SectionHeading eyebrow={eyebrow} title={title} align="left" />
          {lead && (
            <p className="-mt-8 text-base leading-loose sm:text-lg sm:leading-loose">{lead}</p>
          )}
          {quote && (
            <blockquote className="border-l-2 border-[var(--s-accent)] py-1 pl-6">
              <p
                className="text-xl leading-relaxed sm:text-2xl"
                style={{ fontFamily: 'var(--s-heading-font)', letterSpacing: 'var(--s-heading-ls)' }}
              >
                {quote}
              </p>
            </blockquote>
          )}
          <p className="whitespace-pre-line text-sm leading-[2.1] text-[var(--s-muted)] sm:text-[15px]">
            {body}
          </p>
        </div>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Features

export function FeatureCards({
  sectionId,
  eyebrow,
  title,
  description,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  description?: string
  items?: { icon?: string; title?: string; description?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="features">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-start gap-4 bg-[var(--s-surface)] p-8"
              style={{ borderRadius: 'var(--s-radius-card)', boxShadow: 'var(--s-shadow-card)' }}
            >
              <FeatureIcon name={item.icon} />
              <h3 className="text-lg">{item.title}</h3>
              <p className="text-sm leading-loose text-[var(--s-muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

export function FeatureList({
  sectionId,
  eyebrow,
  title,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  items?: { title?: string; description?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="features" bg="surface">
      <Container className="max-w-[46rem]">
        <SectionHeading eyebrow={eyebrow} title={title} align="left" />
        <ol className="flex flex-col">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex gap-6 border-t border-[var(--s-line)] py-7 last:border-b sm:gap-8"
            >
              <span
                className="text-2xl tabular-nums text-[var(--s-accent)]"
                style={{ fontFamily: 'var(--s-heading-font)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg">{item.title}</h3>
                <p className="text-sm leading-loose text-[var(--s-muted)]">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Products

export function ProductGrid({
  sectionId,
  eyebrow,
  title,
  description,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  description?: string
  items?: { image?: AssetReference; name?: string; price?: string; description?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="products">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-3">
              <SmartImage image={item.image} fallbackRatio="1/1" />
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base">{item.name}</h3>
                {item.price && (
                  <p className="shrink-0 text-sm tabular-nums text-[var(--s-accent)]">{item.price}</p>
                )}
              </div>
              {item.description && (
                <p className="text-[13px] leading-relaxed text-[var(--s-muted)]">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

export function ProductShowcase({
  sectionId,
  eyebrow,
  title,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  items?: { image?: AssetReference; name?: string; price?: string; description?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="products" bg="surface">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="flex flex-col gap-16 sm:gap-20">
          {items.map((item, i) => (
            <div
              key={i}
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${
                i % 2 === 1 ? 'md:[direction:rtl]' : ''
              }`}
            >
              <div className="md:[direction:ltr]">
                <SmartImage image={item.image} fallbackRatio="3/2" />
              </div>
              <div className="flex flex-col items-start gap-4 md:[direction:ltr]">
                <h3 className="text-xl sm:text-2xl">{item.name}</h3>
                {item.price && (
                  <p className="text-sm tabular-nums text-[var(--s-accent)]">{item.price}</p>
                )}
                <p className="text-sm leading-[2] text-[var(--s-muted)] sm:text-[15px]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

export function MenuList({
  sectionId,
  eyebrow,
  title,
  description,
  items = [],
  note,
}: Base & {
  eyebrow?: string
  title?: string
  description?: string
  items?: { name?: string; price?: string; description?: string }[]
  note?: string
}) {
  return (
    <Section sectionId={sectionId} category="products">
      <Container className="max-w-[42rem]">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <ul className="flex flex-col">
          {items.map((item, i) => (
            <li key={i} className="border-t border-[var(--s-line)] py-5 last:border-b">
              <div className="flex items-baseline gap-3">
                <p className="text-[15px]">{item.name}</p>
                <span
                  className="mx-1 grow border-b border-dotted border-[var(--s-line)]"
                  aria-hidden
                />
                <p className="shrink-0 text-[15px] tabular-nums">{item.price}</p>
              </div>
              {item.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--s-muted)]">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
        {note && <p className="mt-6 text-xs text-[var(--s-muted)]">{note}</p>}
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Gallery

export function GalleryGrid({
  sectionId,
  eyebrow,
  title,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  items?: { image?: AssetReference; caption?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="gallery">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item, i) => (
            <figure key={i} className="flex flex-col gap-2">
              <SmartImage image={item.image} fallbackRatio="1/1" />
              {item.caption && (
                <figcaption className="text-[11px] tracking-wide text-[var(--s-muted)]">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  )
}

export function GalleryStrip({
  sectionId,
  items = [],
}: Base & { items?: { image?: AssetReference; caption?: string }[] }) {
  return (
    <Section sectionId={sectionId} category="gallery" padded={false} className="py-6">
      <div className="flex gap-3 overflow-x-auto px-5 pb-3 sm:gap-4 sm:px-8 [scrollbar-width:thin]">
        {items.map((item, i) => (
          <div key={i} className="w-52 shrink-0 sm:w-64">
            <SmartImage image={item.image} fallbackRatio="3/4" />
          </div>
        ))}
      </div>
    </Section>
  )
}

// ───────────────────────────────────────────── Testimonials

export function TestimonialCards({
  sectionId,
  eyebrow,
  title,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  items?: { quote?: string; author?: string; meta?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="testimonials" bg="surface">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {items.map((item, i) => (
            <figure
              key={i}
              className="flex flex-col gap-5 bg-[var(--s-bg)] p-8 sm:p-10"
              style={{ borderRadius: 'var(--s-radius-card)', boxShadow: 'var(--s-shadow-card)' }}
            >
              <span aria-hidden className="text-4xl leading-none text-[var(--s-accent)]" style={{ fontFamily: 'Georgia, serif' }}>
                “
              </span>
              <blockquote className="-mt-4 text-sm leading-[2] sm:text-[15px]">{item.quote}</blockquote>
              <figcaption className="text-xs text-[var(--s-muted)]">
                {item.author}
                {item.meta && <span className="ml-2 opacity-80">{item.meta}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  )
}

export function TestimonialSingle({
  sectionId,
  quote,
  author,
  meta,
}: Base & { quote?: string; author?: string; meta?: string }) {
  return (
    <Section sectionId={sectionId} category="testimonials">
      <Container className="flex max-w-[44rem] flex-col items-center gap-6 text-center">
        <span aria-hidden className="text-5xl leading-none text-[var(--s-accent)]" style={{ fontFamily: 'Georgia, serif' }}>
          “
        </span>
        <blockquote
          className="-mt-3 text-xl leading-relaxed sm:text-2xl sm:leading-relaxed"
          style={{ fontFamily: 'var(--s-heading-font)', letterSpacing: 'var(--s-heading-ls)' }}
        >
          {quote}
        </blockquote>
        <p className="text-xs text-[var(--s-muted)]">
          {author}
          {meta && <span className="ml-2 opacity-80">{meta}</span>}
        </p>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── FAQ

export function FaqAccordion({
  sectionId,
  eyebrow,
  title,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  items?: { question?: string; answer?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="faq">
      <Container className="max-w-[42rem]">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="flex flex-col">
          {items.map((item, i) => (
            <details key={i} className="group border-t border-[var(--s-line)] last:border-b">
              <summary className="flex items-center justify-between gap-4 py-5 text-[15px]">
                <span className="flex gap-3">
                  <span className="text-[var(--s-accent)]">Q</span>
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-lg text-[var(--s-muted)] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 pl-7 text-sm leading-loose text-[var(--s-muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  )
}

export function FaqSimple({
  sectionId,
  eyebrow,
  title,
  items = [],
}: Base & {
  eyebrow?: string
  title?: string
  items?: { question?: string; answer?: string }[]
}) {
  return (
    <Section sectionId={sectionId} category="faq" bg="surface">
      <Container className="max-w-[42rem]">
        <SectionHeading eyebrow={eyebrow} title={title} align="left" />
        <dl className="flex flex-col gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-2">
              <dt className="flex gap-3 text-[15px] font-medium">
                <span className="text-[var(--s-accent)]">Q</span>
                {item.question}
              </dt>
              <dd className="pl-7 text-sm leading-loose text-[var(--s-muted)]">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── CTA

export function CtaBanner({
  sectionId,
  title,
  description,
  cta,
  subNote,
}: Base & { title?: string; description?: string; cta?: CtaLink; subNote?: string }) {
  return (
    <Section sectionId={sectionId} category="cta" bg="primary">
      <Container className="flex flex-col items-center gap-5 text-center">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {description && <p className="max-w-xl text-sm leading-loose opacity-85">{description}</p>}
        <div className="mt-1">
          <CtaButton cta={cta} onDark />
        </div>
        {subNote && <p className="text-xs opacity-75">{subNote}</p>}
      </Container>
    </Section>
  )
}

export function CtaSplit({
  sectionId,
  title,
  description,
  tel,
  hours,
  cta,
}: Base & {
  title?: string
  description?: string
  tel?: string
  hours?: string
  cta?: CtaLink
}) {
  return (
    <Section sectionId={sectionId} category="cta" bg="surface">
      <Container className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl sm:text-3xl">{title}</h2>
          {description && (
            <p className="text-sm leading-loose text-[var(--s-muted)]">{description}</p>
          )}
        </div>
        <div
          className="flex flex-col items-center gap-3 bg-[var(--s-bg)] p-8 text-center sm:p-10"
          style={{ borderRadius: 'var(--s-radius-card)', boxShadow: 'var(--s-shadow-card)' }}
        >
          {tel && (
            <>
              <a
                href={`tel:${tel.replace(/[^\d+]/g, '')}`}
                className="text-3xl tabular-nums no-underline"
                style={{ fontFamily: 'var(--s-heading-font)' }}
              >
                {tel}
              </a>
              {hours && <p className="text-xs text-[var(--s-muted)]">{hours}</p>}
            </>
          )}
          {cta && (
            <div className="mt-2">
              <CtaButton cta={cta} variant={tel ? 'ghost' : 'primary'} />
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Access

export function AccessInfo({
  sectionId,
  title = 'アクセス',
  address,
  tel,
  hours,
  closed,
  note,
  showMap = 'yes',
}: Base & {
  title?: string
  address?: string
  tel?: string
  hours?: string
  closed?: string
  note?: string
  showMap?: 'yes' | 'no'
}) {
  const rows: [string, string | undefined][] = [
    ['住所', address],
    ['電話', tel],
    ['営業時間', hours],
    ['定休日', closed],
    ['備考', note],
  ]
  return (
    <Section sectionId={sectionId} category="access">
      <Container>
        <SectionHeading title={title} />
        <div className={`grid gap-10 ${showMap === 'yes' ? 'md:grid-cols-2' : 'md:max-w-[36rem] md:mx-auto'}`}>
          {showMap === 'yes' && address && (
            <div
              className="overflow-hidden"
              style={{ borderRadius: 'var(--s-radius-img)', boxShadow: 'var(--s-shadow-card)' }}
            >
              <iframe
                title="地図"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`}
                className="h-72 w-full border-0 md:h-full md:min-h-80"
                loading="lazy"
              />
            </div>
          )}
          <dl className="flex flex-col self-center">
            {rows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[6rem_1fr] gap-4 border-t border-[var(--s-line)] py-4 text-sm last:border-b"
                >
                  <dt className="text-[var(--s-muted)]">{label}</dt>
                  <dd className="leading-relaxed">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      </Container>
    </Section>
  )
}

export function AccessSimple({
  sectionId,
  title = '店舗情報',
  items = [],
}: Base & { title?: string; items?: { label?: string; value?: string }[] }) {
  return (
    <Section sectionId={sectionId} category="access" bg="surface">
      <Container className="max-w-[36rem]">
        <SectionHeading title={title} />
        <dl className="flex flex-col">
          {items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[6rem_1fr] gap-4 border-t border-[var(--s-line)] py-4 text-sm last:border-b"
            >
              <dt className="text-[var(--s-muted)]">{item.label}</dt>
              <dd className="leading-relaxed">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Contact

export function ContactSimple({
  sectionId,
  title,
  description,
  tel,
  email,
  hours,
}: Base & {
  title?: string
  description?: string
  tel?: string
  email?: string
  hours?: string
}) {
  return (
    <Section sectionId={sectionId} category="contact">
      <Container className="flex max-w-[36rem] flex-col items-center gap-6 text-center">
        <SectionHeading title={title} description={description} />
        <div className="-mt-8 flex w-full flex-col items-center gap-4">
          {tel && (
            <a
              href={`tel:${tel.replace(/[^\d+]/g, '')}`}
              className="text-3xl tabular-nums no-underline"
              style={{ fontFamily: 'var(--s-heading-font)' }}
            >
              {tel}
            </a>
          )}
          {hours && <p className="text-xs text-[var(--s-muted)]">{hours}</p>}
          {email && (
            <div className="mt-2">
              <CtaButton cta={{ label: 'メールで問い合わせる', href: `mailto:${email}` }} variant={tel ? 'ghost' : 'primary'} />
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}

export function ContactForm({
  sectionId,
  title,
  description,
  email,
  note,
}: Base & { title?: string; description?: string; email?: string; note?: string }) {
  const input =
    'w-full border border-[var(--s-line)] bg-[var(--s-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--s-primary)]'
  const radius = { borderRadius: 'var(--s-radius-card)' }
  return (
    <Section sectionId={sectionId} category="contact" bg="surface">
      <Container className="max-w-[36rem]">
        <SectionHeading title={title} description={description} />
        <form
          action={email ? `mailto:${email}` : undefined}
          method="post"
          encType="text/plain"
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-xs text-[var(--s-muted)]">
            お名前
            <input type="text" name="お名前" className={input} style={radius} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-[var(--s-muted)]">
            メールアドレスまたはお電話番号
            <input type="text" name="連絡先" className={input} style={radius} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-[var(--s-muted)]">
            お問い合わせ内容
            <textarea name="内容" rows={5} className={input} style={radius} />
          </label>
          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center bg-[var(--s-primary)] px-7 py-3.5 text-sm font-medium tracking-wide text-[var(--s-on-primary)] transition-opacity hover:opacity-85"
            style={{ borderRadius: 'var(--s-radius-btn)' }}
          >
            送信する
          </button>
          {note && <p className="text-center text-xs text-[var(--s-muted)]">{note}</p>}
        </form>
      </Container>
    </Section>
  )
}

// ───────────────────────────────────────────── Footer

export function FooterSimple({
  sectionId,
  siteName,
  nav,
}: Base & { siteName?: string; nav?: NavItem[] }) {
  return (
    <Section sectionId={sectionId} category="footer" padded={false} className="border-t border-[var(--s-line)]">
      <Container className="flex flex-col items-center gap-5 py-12 text-center">
        <p className="text-lg" style={{ fontFamily: 'var(--s-heading-font)', letterSpacing: 'var(--s-heading-ls)' }}>
          {siteName}
        </p>
        <NavLinks nav={nav} />
        <p className="mt-2 text-[11px] tracking-wider text-[var(--s-muted)]">
          © {siteName}
        </p>
      </Container>
    </Section>
  )
}

export function FooterRich({
  sectionId,
  siteName,
  description,
  address,
  tel,
  hours,
  nav,
}: Base & {
  siteName?: string
  description?: string
  address?: string
  tel?: string
  hours?: string
  nav?: NavItem[]
}) {
  return (
    <Section sectionId={sectionId} category="footer" padded={false} className="border-t border-[var(--s-line)]">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div className="flex flex-col gap-2 md:col-span-2">
          <p className="text-xl" style={{ fontFamily: 'var(--s-heading-font)', letterSpacing: 'var(--s-heading-ls)' }}>
            {siteName}
          </p>
          {description && <p className="text-xs text-[var(--s-muted)]">{description}</p>}
          <div className="mt-4 flex flex-col gap-1 text-[13px] leading-relaxed text-[var(--s-muted)]">
            {address && <p>{address}</p>}
            {tel && <p>TEL {tel}</p>}
            {hours && <p>{hours}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {nav && nav.length > 0 && (
            <ul className="flex flex-col gap-2 md:text-right">
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
          )}
        </div>
      </Container>
      <div className="border-t border-[var(--s-line)] py-4 text-center text-[11px] tracking-wider text-[var(--s-muted)]">
        © {siteName}
      </div>
    </Section>
  )
}
