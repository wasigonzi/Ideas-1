/**
 * Types and defaults for editable landing-page content.
 * Values are persisted in the SiteSetting table (key-value pairs).
 * Complex values (logosItems) are stored as JSON strings in the DB.
 */

export type LogoItem = { src: string; alt: string };

export type SiteConfig = {
  // ── Hero ──────────────────────────────────────────────────────────────────
  heroBgImage: string;
  heroCardImage: string;
  heroCardBadge: string;
  heroCardTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroStat1Value: string;
  heroStat1Label: string;
  heroStat2Value: string;
  heroStat2Label: string;
  heroStat3Value: string;
  heroStat3Label: string;
  // ── Stats bar ─────────────────────────────────────────────────────────────
  statsClients: string;
  statsProjects: string;
  statsSpace: string;
  statsYears: string;
  // ── Client logos ──────────────────────────────────────────────────────────
  logosTitle: string;
  logosItems: LogoItem[]; // array in memory — JSON string in DB
  // ── Services section ──────────────────────────────────────────────────────
  servicesEyebrow: string;
  servicesTitle: string;
  servicesSubtitle: string;
  servicesMore: string;
  // ── Projects section ──────────────────────────────────────────────────────
  projectsEyebrow: string;
  projectsTitle: string;
  projectsSubtitle: string;
  projectsViewAll: string;
  // ── CTA band ──────────────────────────────────────────────────────────────
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  // ── Contact ───────────────────────────────────────────────────────────────
  whatsapp: string;
};

const S = "https://static.showit.co/200";
export const DEFAULT_LOGOS: LogoItem[] = [
  { src: `${S}/huOjXPKjQzRd-m18fvGrnA/shared/logo_conwaste_new.png`, alt: "Conwaste" },
  { src: `${S}/pJz68KELZc4_l3bBO4XFIA/shared/centromedico-.png`, alt: "Centro Médico" },
  { src: `${S}/qi0SH5aHraOZ8dgdbAbAEQ/shared/triple-s-logo-vector.png`, alt: "Triple-S" },
  { src: `${S}/8Jp1ZKYC17-OBo8ohlu-NA/shared/wipr-logo.png`, alt: "WIPR" },
  { src: `${S}/h2HHTS3FqT2TEWtrjbMXmA/300046/mida-logo-oficial.png`, alt: "MIDA" },
  {
    src: `${S}/JimK7zrKPL4qBICBI6HQCg/300046/museo-de-arte-de-puerto-rico-logo2x.png`,
    alt: "Museo de Arte de Puerto Rico",
  },
  { src: `${S}/2oH0JaRB4uPbmm43qgyi9w/300046/wicnuevoazul4.png`, alt: "WIC" },
  { src: `${S}/VxMD8oGICw11lxSGaVljxA/300046/leonardo.png`, alt: "Leonardo" },
  { src: `${S}/3abu30Q6EtIy4kyusDwbnA/300046/cangrejeros.png`, alt: "Cangrejeros" },
  {
    src: `${S}/RVQmfdZVZNOZPl7031fqTg/300046/logo_sme_sin_fondo_blanco_sml.png`,
    alt: "SME PR",
  },
];

export const SITE_CONFIG_DEFAULTS: SiteConfig = {
  // Hero
  heroBgImage:
    "https://static.showit.co/1200/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png",
  heroCardImage:
    "https://static.showit.co/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg",
  heroCardBadge: "Proyecto destacado",
  heroCardTitle: "Manufactura de letras 3D",
  heroTitle: "Transformamos tus ideas en impresión y rotulación.",
  heroSubtitle:
    "Más de 8,500 pies cuadrados de espacio para ofrecer impresiones y rotulación de primera. Soluciones integrales en Puerto Rico y el extranjero.",
  heroCtaPrimary: "Solicita una cotización",
  heroCtaSecondary: "Ver servicios",
  heroStat1Value: "8,500",
  heroStat1Label: "pies² de taller",
  heroStat2Value: "2,943+",
  heroStat2Label: "unidades rotuladas",
  heroStat3Value: "15+",
  heroStat3Label: "años de experiencia",
  // Stats
  statsClients: "350",
  statsProjects: "2943",
  statsSpace: "8500",
  statsYears: "15",
  // Logos
  logosTitle: "Marcas que confían en nosotros",
  logosItems: DEFAULT_LOGOS,
  // Services section
  servicesEyebrow: "Servicios",
  servicesTitle: "Servicios que se adaptan a tus necesidades",
  servicesSubtitle:
    "Manufactura, instalación, rotulación e impresión digital de gran formato.",
  servicesMore: "Conoce más",
  // Projects section
  projectsEyebrow: "Proyectos",
  projectsTitle: "Proyectos realizados con éxito",
  projectsSubtitle:
    "Trabajamos en diversos sectores: comercial, gobierno, eventos y más.",
  projectsViewAll: "Ver todos",
  // CTA
  ctaTitle: "¡Haz tu cotización hoy!",
  ctaSubtitle: "Cuéntanos tu idea y te enviaremos una propuesta personalizada.",
  ctaButton: "Solicita aquí",
  // Contact
  whatsapp: "19393264007",
};

/** Merge DB rows into a full SiteConfig, filling gaps with defaults. */
export function mergeConfig(rows: { key: string; value: string }[]): SiteConfig {
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.key !== "logosItems") map[r.key] = r.value;
  }

  let logosItems: LogoItem[] = SITE_CONFIG_DEFAULTS.logosItems;
  const logosRow = rows.find((r) => r.key === "logosItems");
  if (logosRow?.value) {
    try {
      const parsed = JSON.parse(logosRow.value);
      if (Array.isArray(parsed) && parsed.length > 0) logosItems = parsed;
    } catch {
      // keep defaults
    }
  }

  return { ...SITE_CONFIG_DEFAULTS, ...map, logosItems } as SiteConfig;
}
