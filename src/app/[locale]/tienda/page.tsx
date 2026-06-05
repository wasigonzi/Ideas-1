import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";
import { PAGE_DEFAULTS } from "@/components/landing-builder/registry";

export const revalidate = 60;

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
