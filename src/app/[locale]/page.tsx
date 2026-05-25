import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { ServicesGrid } from "@/components/ServicesGrid";
import { ProjectsShowcase } from "@/components/ProjectsShowcase";
import { CtaBand } from "@/components/CtaBand";
import { ClientsLogos } from "@/components/ClientsLogos";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { mergeConfig } from "@/lib/site-config";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";

// Revalidate at most once per 60s; landing editor can call revalidateTag("home") to bust.
export const revalidate = 60;

const getHomeData = unstable_cache(
  async () => {
    const [services, projects, settingRows, employees] = await Promise.all([
      prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" }, take: 6 }),
      prisma.project.findMany({ where: { featured: true }, orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.siteSetting.findMany(),
      prisma.user.findMany({ where: { role: "employee" }, select: { id: true, name: true, avatar: true } }),
    ]);
    return { services, projects, settingRows, employees };
  },
  ["home-data"],
  { revalidate: 60, tags: ["home"] },
);

export default async function HomePage() {
  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  let projects: Awaited<ReturnType<typeof prisma.project.findMany>> = [];
  let settingRows: Awaited<ReturnType<typeof prisma.siteSetting.findMany>> = [];
  let employees: { id: string; name: string | null; avatar: string | null }[] = [];
  try {
    const data = await getHomeData();
    services = data.services;
    projects = data.projects;
    settingRows = data.settingRows;
    employees = data.employees;
  } catch {
    // DB unavailable — render with empty defaults
  }

  const config = mergeConfig(settingRows);

  // If a visual landing page has been saved, use it instead of the legacy layout
  const landingRow = settingRows.find((r) => r.key === "landingJson");
  if (landingRow?.value) {
    try {
      const blocks: LandingBlock[] = JSON.parse(landingRow.value);
      if (blocks.length > 0) {
        return (
          <LandingRenderer
            blocks={blocks}
            services={services}
            projects={projects}
            employees={employees.map((e) => ({ id: e.id, name: e.name ?? "", avatarUrl: e.avatar }))}
          />
        );
      }
    } catch {
      // Fall through to legacy layout if JSON is invalid
    }
  }

  // Legacy layout
  return (
    <>
      <Hero config={config} />
      <Stats config={config} />
      <ClientsLogos config={config} />
      <ServicesGrid services={services} config={config} />
      <ProjectsShowcase projects={projects} config={config} />
      <CtaBand config={config} />
    </>
  );
}
