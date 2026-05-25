import { prisma } from "@/lib/prisma";
import { ProjectsShowcase } from "@/components/ProjectsShowcase";
import { CtaBand } from "@/components/CtaBand";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";

export const revalidate = 60;

export default async function ProyectosPage() {
  const [projects, blocksRow] = await Promise.all([
    prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.siteSetting.findUnique({ where: { key: "pageProyectosJson" } }).catch(() => null),
  ]);

  if (blocksRow?.value) {
    try {
      const blocks: LandingBlock[] = JSON.parse(blocksRow.value);
      if (blocks.length > 0) {
        return <LandingRenderer blocks={blocks} projects={projects} />;
      }
    } catch { /* fall through */ }
  }

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
