import { prisma } from "@/lib/prisma";
import { ProjectsShowcase } from "@/components/ProjectsShowcase";
import { CtaBand } from "@/components/CtaBand";

export const revalidate = 60;

export default async function ProyectosPage() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <section className="pt-[120px] pb-6">
        <div className="container-x">
          <span className="eyebrow">Proyectos</span>
          <h1 className="heading-xl mt-3 max-w-3xl">Trabajos realizados con éxito</h1>
          <p className="mt-5 text-lg text-white/70 max-w-2xl">
            Hemos rotulado más de <strong>4,000 unidades comerciales</strong> en sectores como
            retail, gobierno, salud, eventos y flotas comerciales.
          </p>
        </div>
      </section>
      <ProjectsShowcase projects={projects} />
      <CtaBand />
    </>
  );
}
