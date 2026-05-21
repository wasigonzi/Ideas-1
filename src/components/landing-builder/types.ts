export type BlockType =
  | "HeroBlock"
  | "StatsBlock"
  | "LogoCloudBlock"
  | "ServicesBlock"
  | "ProjectsBlock"
  | "CtaBandBlock"
  | "TestimonialsBlock"
  | "FaqBlock"
  | "TextImageBlock"
  | "BannerBlock"
  | "VideoBlock"
  | "GalleryBlock"
  | "RichTextBlock"
  | "SpacerBlock"
  | "DividerBlock"
  | "TeamBlock"
  | "ContactFormBlock";

export interface LandingBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;        // desktop (base)
  propsTablet?: Record<string, unknown>; // tablet overrides (768–1023 px)
  propsMobile?: Record<string, unknown>; // mobile overrides (<768 px)
}

export interface BlockMeta {
  label: string;
  emoji: string;
  category: "hero" | "content" | "data" | "media" | "layout" | "interactive";
  defaultProps: Record<string, unknown>;
  component: React.ComponentType<Record<string, unknown>>;
  settingsComponent: React.ComponentType<{
    props: Record<string, unknown>;
    onChange: (updates: Record<string, unknown>) => void;
  }>;
}

export type BlockRegistry = Record<BlockType, BlockMeta>;
