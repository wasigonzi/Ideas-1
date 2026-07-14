import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";
import { PAGE_DEFAULTS } from "@/components/landing-builder/registry";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tienda de Rótulos, Banners y Stickers | Ideas, LLC",
  description:
    "Compra banners, stickers, roll-ups y rótulos personalizados en línea. Impresión de gran formato con entrega rápida en Puerto Rico.",
  keywords: [
    "comprar banners Puerto Rico",
    "stickers personalizados PR",
    "tienda de rótulos en línea",
    "roll up banners Puerto Rico",
    "d-boards Puerto Rico"
  ],
  alternates: { canonical: "/tienda" },
  openGraph: {
    title: "Tienda de Rótulos, Banners y Stickers | Ideas, LLC",
    description: "Compra banners, stickers, roll-ups y rótulos personalizados en línea con entrega rápida en Puerto Rico.",
    url: "https://printingideaspr.com/tienda"
  }
};

export default async function TiendaPage() {
  const [products, blocksRow] = await Promise.all([
    prisma.storeProduct.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.siteSetting.findUnique({ where: { key: "pageTiendaJson" } }).catch(() => null),
  ]);

  let blocks: LandingBlock[] = PAGE_DEFAULTS["pageTiendaJson"] ?? [];
  if (blocksRow?.value) {
    try {
      const parsed: LandingBlock[] = JSON.parse(blocksRow.value);
      if (parsed.length > 0) blocks = parsed;
    } catch { /* use defaults */ }
  }

  return <LandingRenderer blocks={blocks} storeProducts={products} />;
}
