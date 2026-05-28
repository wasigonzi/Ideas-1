/**
 * Pure-data fallback blocks for each page key.
 * NO React component imports — safe to import from API routes and server code.
 */
import type { LandingBlock } from "./types";

type BlockType = string;

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
        subtitle:
          "Hemos rotulado más de 2,943 unidades comerciales. Manufactura, instalación, rotulación, ingeniería y permisología, perito electricista e impresión digital al por mayor.",
        ctaText: "",
        padTop: 120,
        padBottom: 40,
        maxWidth: "1200px",
      },
    },
    { id: "svc-grid", type: "ServicesBlock" as BlockType, props: {} },
    { id: "svc-cta", type: "CtaBandBlock" as BlockType, props: {} },
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
        subtitle:
          "Hemos rotulado más de 4,000 unidades comerciales en sectores como retail, gobierno, salud, eventos y flotas comerciales.",
        ctaText: "",
        padTop: 120,
        padBottom: 40,
        maxWidth: "1200px",
      },
    },
    { id: "pry-grid", type: "ProjectsBlock" as BlockType, props: {} },
    { id: "pry-cta", type: "CtaBandBlock" as BlockType, props: {} },
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
    { id: "nos-cta", type: "CtaBandBlock" as BlockType, props: {} },
  ],
};
