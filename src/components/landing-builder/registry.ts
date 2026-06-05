import type { BlockRegistry, LandingBlock, BlockType } from "./types";
export { DEFAULT_BLOCKS, PAGE_DEFAULTS } from "./page-defaults";

// ── Block components ──────────────────────────────────────────────────────
import { HeroBlock, HeroSettings, heroDefaults } from "./blocks/HeroBlock";
import { StatsBlock, StatsSettings, statsDefaults } from "./blocks/StatsBlock";
import { LogoCloudBlock, LogoCloudSettings, logoCloudDefaults } from "./blocks/LogoCloudBlock";
import { ServicesBlock, ServicesSettings, servicesDefaults } from "./blocks/ServicesBlock";
import { ProjectsBlock, ProjectsSettings, projectsDefaults } from "./blocks/ProjectsBlock";
import { CtaBandBlock, CtaBandSettings, ctaBandDefaults } from "./blocks/CtaBandBlock";
import { TestimonialsBlock, TestimonialsSettings, testimonialsDefaults } from "./blocks/TestimonialsBlock";
import { FaqBlock, FaqSettings, faqDefaults } from "./blocks/FaqBlock";
import { TextImageBlock, TextImageSettings, textImageDefaults } from "./blocks/TextImageBlock";
import { BannerBlock, BannerSettings, bannerDefaults } from "./blocks/BannerBlock";
import { VideoBlock, VideoSettings, videoDefaults } from "./blocks/VideoBlock";
import { GalleryBlock, GallerySettings, galleryDefaults } from "./blocks/GalleryBlock";
import { RichTextBlock, RichTextSettings, richTextDefaults } from "./blocks/RichTextBlock";
import { SpacerBlock, SpacerSettings, spacerDefaults } from "./blocks/SpacerBlock";
import { DividerBlock, DividerSettings, dividerDefaults } from "./blocks/DividerBlock";
import { TeamBlock, TeamSettings, teamDefaults } from "./blocks/TeamBlock";
import { ContactFormBlock, ContactFormSettings, contactFormDefaults } from "./blocks/ContactFormBlock";
import { StoreProductsBlock, StoreProductsSettings, storeProductsDefaults } from "./blocks/StoreProductsBlock";
import { QuoteFormBlock, QuoteFormSettings, quoteFormDefaults } from "./blocks/QuoteFormBlock";

export const BLOCK_REGISTRY: BlockRegistry = {
  HeroBlock: {
    label: "Hero",
    emoji: "🦸",
    category: "hero",
    defaultProps: heroDefaults,
    component: HeroBlock,
    settingsComponent: HeroSettings,
  },
  StatsBlock: {
    label: "Estadísticas",
    emoji: "📊",
    category: "content",
    defaultProps: statsDefaults,
    component: StatsBlock,
    settingsComponent: StatsSettings,
  },
  LogoCloudBlock: {
    label: "Logos clientes",
    emoji: "🏢",
    category: "content",
    defaultProps: logoCloudDefaults,
    component: LogoCloudBlock,
    settingsComponent: LogoCloudSettings,
  },
  ServicesBlock: {
    label: "Servicios",
    emoji: "⚙️",
    category: "data",
    defaultProps: servicesDefaults,
    component: ServicesBlock,
    settingsComponent: ServicesSettings,
  },
  ProjectsBlock: {
    label: "Proyectos",
    emoji: "🖼️",
    category: "data",
    defaultProps: projectsDefaults,
    component: ProjectsBlock,
    settingsComponent: ProjectsSettings,
  },
  CtaBandBlock: {
    label: "CTA Band",
    emoji: "📣",
    category: "hero",
    defaultProps: ctaBandDefaults,
    component: CtaBandBlock,
    settingsComponent: CtaBandSettings,
  },
  TestimonialsBlock: {
    label: "Testimonios",
    emoji: "💬",
    category: "content",
    defaultProps: testimonialsDefaults,
    component: TestimonialsBlock,
    settingsComponent: TestimonialsSettings,
  },
  FaqBlock: {
    label: "FAQ",
    emoji: "❓",
    category: "content",
    defaultProps: faqDefaults,
    component: FaqBlock,
    settingsComponent: FaqSettings,
  },
  TextImageBlock: {
    label: "Texto + Imagen",
    emoji: "📰",
    category: "content",
    defaultProps: textImageDefaults,
    component: TextImageBlock,
    settingsComponent: TextImageSettings,
  },
  BannerBlock: {
    label: "Banner",
    emoji: "🖼",
    category: "hero",
    defaultProps: bannerDefaults,
    component: BannerBlock,
    settingsComponent: BannerSettings,
  },
  VideoBlock: {
    label: "Video",
    emoji: "▶️",
    category: "media",
    defaultProps: videoDefaults,
    component: VideoBlock,
    settingsComponent: VideoSettings,
  },
  GalleryBlock: {
    label: "Galería",
    emoji: "🎨",
    category: "media",
    defaultProps: galleryDefaults,
    component: GalleryBlock,
    settingsComponent: GallerySettings,
  },
  RichTextBlock: {
    label: "Texto rico",
    emoji: "📝",
    category: "content",
    defaultProps: richTextDefaults,
    component: RichTextBlock,
    settingsComponent: RichTextSettings,
  },
  SpacerBlock: {
    label: "Espaciador",
    emoji: "↕️",
    category: "layout",
    defaultProps: spacerDefaults,
    component: SpacerBlock,
    settingsComponent: SpacerSettings,
  },
  DividerBlock: {
    label: "Divisor",
    emoji: "➖",
    category: "layout",
    defaultProps: dividerDefaults,
    component: DividerBlock,
    settingsComponent: DividerSettings,
  },
  TeamBlock: {
    label: "Equipo",
    emoji: "👥",
    category: "data",
    defaultProps: teamDefaults,
    component: TeamBlock,
    settingsComponent: TeamSettings,
  },
  ContactFormBlock: {
    label: "Formulario",
    emoji: "📨",
    category: "interactive",
    defaultProps: contactFormDefaults,
    component: ContactFormBlock,
    settingsComponent: ContactFormSettings,
  },
  StoreProductsBlock: {
    label: "Productos (tienda)",
    emoji: "🛒",
    category: "store",
    defaultProps: storeProductsDefaults,
    component: StoreProductsBlock,
    settingsComponent: StoreProductsSettings,
  },
  QuoteFormBlock: {
    label: "Formulario de cotización",
    emoji: "📝",
    category: "form",
    defaultProps: quoteFormDefaults,
    component: QuoteFormBlock,
    settingsComponent: QuoteFormSettings,
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero / Banner",
  content: "Contenido",
  data: "Datos dinámicos",
  store: "Tienda",
  form: "Formularios",
  media: "Media",
  layout: "Layout",
  interactive: "Interactivo",
};
