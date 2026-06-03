import { prisma } from "@/lib/prisma";

export type ProjectStageDTO = {
  key: string;
  label: string;
  accent: string | null;
};

// Etapas por defecto del flujo del taller (basadas en los pasos 1–10 de la
// visión de negocio). Se usan cuando la tabla ProjectStage está vacía.
export const DEFAULT_PROJECT_STAGES: ProjectStageDTO[] = [
  { key: "intake", label: "Estimado / Orden", accent: "bg-slate-500" },
  { key: "approval", label: "Aprobación de arte", accent: "bg-amber-500" },
  { key: "design", label: "Diseño y archivos", accent: "bg-violet-500" },
  { key: "production", label: "Producción", accent: "bg-orange-500" },
  { key: "finishing", label: "Terminaciones", accent: "bg-sky-500" },
  { key: "quality", label: "Calidad / Entrega", accent: "bg-cyan-500" },
  { key: "closing", label: "Cobro y cierre", accent: "bg-emerald-500" },
];

export async function loadProjectStages(): Promise<ProjectStageDTO[]> {
  const rows = await prisma.projectStage.findMany({
    where: { archived: false },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  if (rows.length === 0) return DEFAULT_PROJECT_STAGES;
  return rows.map((r) => ({ key: r.key, label: r.label, accent: r.accent }));
}

// Genera el próximo número de proyecto secuencial cuando no se deriva de un
// estimado. Formato: P-0001, P-0002, ...
export async function nextProjectNumber(): Promise<string> {
  const last = await prisma.workProject.findFirst({
    where: { number: { startsWith: "P-" } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastN = last ? parseInt(last.number.replace("P-", ""), 10) : 0;
  const next = Number.isFinite(lastN) ? lastN + 1 : 1;
  return `P-${String(next).padStart(4, "0")}`;
}
