import "./globals.css";
import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";

const FALLBACK_TITLE = "Ideas, LLC — Impresión y rotulación en Puerto Rico";
const FALLBACK_DESCRIPTION =
  "Más de 8,500 pies cuadrados de espacio para ofrecer impresiones y rotulación de primera. Manufactura, instalación, rotulación e impresión digital.";

export async function generateMetadata(): Promise<Metadata> {
  let settings: Record<string, string> = {};
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["meta_title", "meta_description", "meta_keywords", "meta_og_image"] } }
    });
    settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // DB unavailable — proceed with fallbacks
  }

  const title = settings.meta_title || FALLBACK_TITLE;
  const description = settings.meta_description || FALLBACK_DESCRIPTION;
  const keywords = settings.meta_keywords
    ? settings.meta_keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  const ogImage = settings.meta_og_image || undefined;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL("https://printingideaspr.com"),
    manifest: "/manifest.json",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "Ideas, LLC" },
    icons: {
      apple: "/logos/ideas-pwa-icon.png"
    },
    openGraph: {
      title,
      description,
      locale: "es_PR",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {})
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

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
        <script src="/anti-bis.js" suppressHydrationWarning />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
