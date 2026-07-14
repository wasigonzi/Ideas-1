import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ServicesGrid } from "@/components/ServicesGrid";
import { CtaBand } from "@/components/CtaBand";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Servicios de Impresión y Rotulación en Puerto Rico | Ideas, LLC",
  description:
    "Manufactura, instalación y rotulación de gran formato en Puerto Rico. Ingeniería, permisología, perito electricista e impresión digital al por mayor.",
  keywords: [
    "servicios de rotulación Puerto Rico",
    "impresión gran formato",
    "manufactura de rótulos",
    "instalación de rótulos",
    "permisología rotulación",
    "perito electricista Puerto Rico"
  ],
  alternates: { canonical: "/servicios" },
  openGraph: {
    title: "Servicios de Impresión y Rotulación en Puerto Rico | Ideas, LLC",
    description:
      "Manufactura, instalación y rotulación de gran formato en Puerto Rico. Ingeniería, permisología, perito electricista e impresión digital al por mayor.",
    url: "https://printingideaspr.com/servicios"
  }
};

export default async function ServiciosPage() {
  const [services, blocksRow] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.siteSetting.findUnique({ where: { key: "pageServiciosJson" } }).catch(() => null),
  ]);

  if (blocksRow?.value) {
    try {
      const blocks: LandingBlock[] = JSON.parse(blocksRow.value);
      if (blocks.length > 0) {
        return <LandingRenderer blocks={blocks} services={services} />;
      }
    } catch { /* fall through */ }
  }

  return (
    <>
      <section className="pt-[120px] pb-6">
        <div className="container-x">
          <span className="eyebrow">Servicios</span>
          <h1 className="heading-xl mt-3 max-w-3xl">Nuestros servicios</h1>
          <p className="mt-5 text-lg text-white/70 max-w-2xl">
            Hemos rotulado más de <strong>2,943 unidades comerciales</strong>. Manufactura,
            instalación, rotulación, ingeniería y permisología, perito electricista e impresión
            digital al por mayor.
          </p>
        </div>
      </section>
      <ServicesGrid services={services} />
      <CtaBand />
    </>
  );
}
