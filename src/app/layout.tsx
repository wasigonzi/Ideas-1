import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Ideas, LLC — Impresión y rotulación en Puerto Rico",
  description:
    "Más de 8,500 pies cuadrados de espacio para ofrecer impresiones y rotulación de primera. Manufactura, instalación, rotulación e impresión digital.",
  metadataBase: new URL("https://printingideaspr.com"),
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ideas, LLC" }
};

export const viewport: Viewport = {
  themeColor: "#060b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
