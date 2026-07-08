import "./globals.css";
import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ideas, LLC — Impresión y rotulación en Puerto Rico",
  description:
    "Más de 8,500 pies cuadrados de espacio para ofrecer impresiones y rotulación de primera. Manufactura, instalación, rotulación e impresión digital.",
  metadataBase: new URL("https://printingideaspr.com"),
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ideas, LLC" },
  icons: {
    apple: "/logos/ideas-pwa-icon.png"
  }
};

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
