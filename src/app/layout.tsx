import "./globals.css";
import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://printingideaspr.com";
const FALLBACK_TITLE = "Ideas, LLC — Impresión y rotulación en Puerto Rico";
const FALLBACK_DESCRIPTION =
  "Más de 8,500 pies cuadrados de espacio para ofrecer impresiones y rotulación de primera. Manufactura, instalación, rotulación e impresión digital.";
const FALLBACK_LOGO = "https://static.showit.co/1200/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png";

const SETTINGS_KEYS = [
  "meta_title", "meta_description", "meta_keywords", "meta_og_image",
  "company_name", "logo_url", "contact_phone", "contact_email", "address",
  "social_instagram", "social_facebook", "social_linkedin"
];

async function getSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteSetting.findMany({ where: { key: { in: SETTINGS_KEYS } } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const title = settings.meta_title || FALLBACK_TITLE;
  const description = settings.meta_description || FALLBACK_DESCRIPTION;
  const keywords = settings.meta_keywords
    ? settings.meta_keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  const ogImage = settings.meta_og_image || settings.logo_url || FALLBACK_LOGO;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/" },
    manifest: "/manifest.json",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "Ideas, LLC" },
    icons: {
      apple: "/logos/ideas-pwa-icon.png"
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: settings.company_name || "Ideas, LLC",
      locale: "es_PR",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export const viewport: Viewport = {
  themeColor: "#060b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let faviconUrl: string | null = null;
  try {
    const faviconRow = await prisma.siteSetting.findUnique({ where: { key: "favicon_url" } });
    faviconUrl = faviconRow?.value || null;
  } catch {
    // DB unavailable — proceed without favicon
  }

  const settings = await getSettings();
  const sameAs = [settings.social_instagram, settings.social_facebook, settings.social_linkedin].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.company_name || "Ideas, LLC",
    image: settings.logo_url || FALLBACK_LOGO,
    logo: settings.logo_url || FALLBACK_LOGO,
    url: SITE_URL,
    telephone: settings.contact_phone || undefined,
    email: settings.contact_email || undefined,
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address, addressRegion: "PR", addressCountry: "US" }
      : undefined,
    ...(sameAs.length ? { sameAs } : {})
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script src="/anti-bis.js" suppressHydrationWarning />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
