import type { ComponentType } from 'react'
import * as S from '@/components/site/sections'

/** コンポーネント名 → React 実装。カタログ（lib/site/catalog.ts）と1:1対応 */
export const SITE_COMPONENTS: Record<string, ComponentType<never>> = {
  HeaderSimple: S.HeaderSimple,
  HeaderCentered: S.HeaderCentered,
  HeroCentered: S.HeroCentered,
  HeroSplit: S.HeroSplit,
  HeroFullBleed: S.HeroFullBleed,
  HeroMinimal: S.HeroMinimal,
  StoryImageLeft: S.StoryImageLeft,
  StoryImageRight: S.StoryImageRight,
  StoryEditorial: S.StoryEditorial,
  FeatureCards: S.FeatureCards,
  FeatureList: S.FeatureList,
  ProductGrid: S.ProductGrid,
  ProductShowcase: S.ProductShowcase,
  MenuList: S.MenuList,
  GalleryGrid: S.GalleryGrid,
  GalleryStrip: S.GalleryStrip,
  TestimonialCards: S.TestimonialCards,
  TestimonialSingle: S.TestimonialSingle,
  FaqAccordion: S.FaqAccordion,
  FaqSimple: S.FaqSimple,
  CtaBanner: S.CtaBanner,
  CtaSplit: S.CtaSplit,
  AccessInfo: S.AccessInfo,
  AccessSimple: S.AccessSimple,
  ContactSimple: S.ContactSimple,
  ContactForm: S.ContactForm,
  FooterSimple: S.FooterSimple,
  FooterRich: S.FooterRich,
} as Record<string, ComponentType<never>>
