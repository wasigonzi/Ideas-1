import type { BlockRegistry, LandingBlock, BlockType } from "./types";

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
};

export const DEFAULT_BLOCKS: LandingBlock[] = [
  { id: "default-hero", type: "HeroBlock" as BlockType, props: {} },
  { id: "default-stats", type: "StatsBlock" as BlockType, props: {} },
  { id: "default-logos", type: "LogoCloudBlock" as BlockType, props: {} },
  { id: "default-services", type: "ServicesBlock" as BlockType, props: {} },
  { id: "default-projects", type: "ProjectsBlock" as BlockType, props: {} },
  { id: "default-cta", type: "CtaBandBlock" as BlockType, props: {} },
];

export const PAGE_DEFAULTS: Record<string, LandingBlock[]> = {
  landingJson: DEFAULT_BLOCKS,

  pageServiciosJson: [
    {
      id: "svc-banner",
      type: "BannerBlock" as BlockType,
      props: {
        bgType: "color",
        bgColor: "#0a1422",
        minHeight: 320,
        alignment: "left",
        eyebrow: "Servicios",
        title: "Nuestros servicios",
        subtitle: "Hemos rotulado más de 2,943 unidades comerciales. Manufactura, instalación, rotulación, ingeniería y permisología, perito electricista e impresión digital al por mayor.",
        ctaText: "",
        padTop: 120,
        padBottom: 40,
        maxWidth: "1200px",
      },
    },
    {
      id: "svc-grid",
      type: "ServicesBlock" as BlockType,
      props: {},
    },
    {
      id: "svc-cta",
      type: "CtaBandBlock" as BlockType,
      props: {},
    },
  ],

  pageProyectosJson: [
    {
      id: "pry-banner",
      type: "BannerBlock" as BlockType,
      props: {
        bgType: "color",
        bgColor: "#0a1422",
        minHeight: 320,
        alignment: "left",
        eyebrow: "Proyectos",
        title: "Trabajos realizados con éxito",
        subtitle: "Hemos rotulado más de 4,000 unidades comerciales en sectores como retail, gobierno, salud, eventos y flotas comerciales.",
        ctaText: "",
        padTop: 120,
        padBottom: 40,
        maxWidth: "1200px",
      },
    },
    {
      id: "pry-grid",
      type: "ProjectsBlock" as BlockType,
      props: {},
    },
    {
      id: "pry-cta",
      type: "CtaBandBlock" as BlockType,
      props: {},
    },
  ],

  pageNosotrosJson: [
    {
      id: "nos-banner",
      type: "BannerBlock" as BlockType,
      props: {
        bgType: "color",
        bgColor: "#0a1422",
        minHeight: 340,
        alignment: "left",
        eyebrow: "Sobre nosotros",
        title: "Expertos en rotulación e impresión",
        subtitle: "Convertimos ideas en soluciones visuales que impactan y comunican.",
        ctaText: "",
        padTop: 120,
        padBottom: 48,
        maxWidth: "1200px",
      },
    },
    {
      id: "nos-intro",
      type: "RichTextBlock" as BlockType,
      props: {
        bgType: "none",
        padTop: 48,
        padBottom: 48,
        maxWidth: "900px",
        textAlign: "left",
        html: `<p><strong style="color:#ffae00">Ideas</strong> proporciona soluciones de impresión digital a gran escala, rotulación de flotas comerciales y fabricación de rótulos de alta calidad.</p><br/><p>Ofrecemos una amplia variedad de servicios y productos para su empresa, municipio o agencia. Empresa dedicada a la manufactura de rótulos e impresiones de alto volumen.</p><br/><p>Nacimos con la misión de ofrecer soluciones innovadoras en rotulación, impresión e ingeniería.</p>`,
      },
    },
    {
      id: "nos-logos",
      type: "LogoCloudBlock" as BlockType,
      props: { title: "Marcas que confían en nosotros" },
    },
    {
      id: "nos-mision",
      type: "RichTextBlock" as BlockType,
      props: {
        bgType: "none",
        padTop: 64,
        padBottom: 64,
        maxWidth: "1200px",
        html: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem"><div style="background:#0a1422;border:1px solid rgba(255,255,255,0.08);border-radius:1rem;padding:2.5rem"><h2 style="font-size:1.5rem;font-weight:900;color:#fff;margin-bottom:1rem">Nuestra Misión</h2><p style="color:rgba(255,255,255,0.8);line-height:1.75;font-size:1.05rem">Proporcionar soluciones integrales de rotulación y señalización de alta calidad, ofreciendo servicios eficientes y personalizados para satisfacer las necesidades de nuestros clientes en Puerto Rico y en el extranjero. Nos esforzamos por superar las expectativas, entregando cada proyecto con profesionalismo, cumpliendo con los más altos estándares de la industria y asegurándonos de que se realice dentro del presupuesto y a tiempo.</p></div><div style="background:#ffae00;border-radius:1rem;padding:2.5rem"><h2 style="font-size:1.5rem;font-weight:900;color:#0a1422;margin-bottom:1rem">Nuestra Visión</h2><p style="color:rgba(10,20,34,0.85);line-height:1.75;font-size:1.05rem">Ser líderes en el sector de rotulación e impresión a gran escala, reconocidos por nuestra innovación, excelencia en el servicio y capacidad para transformar las ideas en realidad. Continuamos expandiendo nuestras operaciones internacionales para convertirnos en un referente en la fabricación, instalación y mantenimiento de rotulación.</p></div></div>`,
      },
    },
    {
      id: "nos-valores",
      type: "FaqBlock" as BlockType,
      props: {
        bgType: "none",
        padTop: 64,
        padBottom: 64,
        maxWidth: "1200px",
        variant: "cards",
        eyebrow: "Nuestros valores",
        title: "Lo que nos define",
        items: [
          { question: "Eficiencia", answer: "Cumplimos con tiempos de entrega sin comprometer la calidad." },
          { question: "Personalización", answer: "Cada marca tiene una historia única y la reflejamos en nuestros productos." },
          { question: "Compromiso", answer: "Nos involucramos en cada proyecto como si fuera nuestro." },
          { question: "Innovación", answer: "Nos mantenemos a la vanguardia en tecnología y diseño." },
          { question: "Calidad", answer: "Utilizamos materiales de primera y las mejores técnicas de impresión." },
        ],
      },
    },
    {
      id: "nos-cta",
      type: "CtaBandBlock" as BlockType,
      props: {},
    },
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero / Banner",
  content: "Contenido",
  data: "Datos dinámicos",
  media: "Media",
  layout: "Layout",
  interactive: "Interactivo",
};
