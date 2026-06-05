import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";
import { PAGE_DEFAULTS } from "@/components/landing-builder/registry";

export const revalidate = 60;

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
