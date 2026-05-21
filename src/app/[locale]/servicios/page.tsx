import { prisma } from "@/lib/prisma";
import { ServicesGrid } from "@/components/ServicesGrid";
import { CtaBand } from "@/components/CtaBand";

export const revalidate = 60;

export default async function ServiciosPage() {
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } });
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
