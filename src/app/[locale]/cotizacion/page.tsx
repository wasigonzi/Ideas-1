import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";
import { PAGE_DEFAULTS } from "@/components/landing-builder/registry";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Solicita tu Cotización Gratis | Ideas, LLC Puerto Rico",
  description:
    "Cuéntanos tu proyecto de rotulación o impresión y recibe una cotización personalizada en menos de 24 horas, sin costo ni compromiso.",
  keywords: [
    "cotización rotulación Puerto Rico",
    "presupuesto impresión gran formato",
    "cotizar rótulos PR",
    "solicitar cotización imprenta"
  ],
  alternates: { canonical: "/cotizacion" },
  openGraph: {
    title: "Solicita tu Cotización Gratis | Ideas, LLC Puerto Rico",
    description: "Cuéntanos tu proyecto de rotulación o impresión y recibe una cotización personalizada en menos de 24 horas.",
    url: "https://printingideaspr.com/cotizacion"
  }
};

export default async function CotizacionPage() {
  const blocksRow = await prisma.siteSetting
    .findUnique({ where: { key: "pageCotizacionJson" } })
    .catch(() => null);

  let blocks: LandingBlock[] = PAGE_DEFAULTS["pageCotizacionJson"] ?? [];
  if (blocksRow?.value) {
    try {
      const parsed: LandingBlock[] = JSON.parse(blocksRow.value);
      if (parsed.length > 0) blocks = parsed;
    } catch { /* use defaults */ }
  }

  return <LandingRenderer blocks={blocks} />;
}
