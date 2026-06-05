import { QuoteForm } from "@/components/QuoteForm";
import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";

export const revalidate = 60;

export default async function CotizacionPage() {
  const blocksRow = await prisma.siteSetting
    .findUnique({ where: { key: "pageCotizacionJson" } })
    .catch(() => null);

  if (blocksRow?.value) {
    try {
      const blocks: LandingBlock[] = JSON.parse(blocksRow.value);
      if (blocks.length > 0) return <LandingRenderer blocks={blocks} />;
    } catch { /* fall through */ }
  }

  return (
    <section className="pt-[120px] pb-24">
      <div className="container-x grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <span className="eyebrow">Cotización</span>
          <h1 className="heading-xl mt-3">Solicita una cotización</h1>
          <p className="mt-5 text-white/70 text-lg leading-relaxed">Llena el formulario y nuestro equipo te responderá en menos de 24 horas.</p>
          <div className="mt-8 space-y-3 text-sm text-white/85">
            <div>📞 939-356-3399</div>
            <div>✉️ ventas@printingideaspr.com</div>
            <div>📍 Puerto Rico</div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
