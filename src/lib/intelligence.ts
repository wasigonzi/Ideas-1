import { prisma } from "@/lib/prisma";
import { loadProjectStages } from "@/lib/project-stages";
import { projectCost } from "@/lib/pricing";

// Meta de ventas mensual por defecto (visión del negocio: $300,000/mes).
const DEFAULT_MONTHLY_GOAL = 300_000;
const GOAL_KEY = "intel.monthlyGoal";

export async function getMonthlyGoal(): Promise<number> {
  const row = await prisma.siteSetting.findUnique({ where: { key: GOAL_KEY } });
  const v = row ? parseFloat(row.value) : NaN;
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_MONTHLY_GOAL;
}

export async function setMonthlyGoal(value: number): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: GOAL_KEY },
    create: { key: GOAL_KEY, value: String(value) },
    update: { value: String(value) },
  });
}

export type StageBucket = {
  key: string;
  label: string;
  accent: string | null;
  count: number;
  value: number; // suma cotizada en la etapa
  avgDaysInStage: number | null; // antigüedad promedio (cuello de botella)
  bottleneck: boolean;
};

export type SellerStat = {
  userId: string;
  name: string | null;
  projects: number;
  value: number; // ventas atribuidas
};

export type InstallMix = {
  noInstall: number;      // conteo de proyectos activos sin instalación
  withInstall: number;    // conteo de proyectos activos con instalación
  noInstallPct: number;   // % sobre total activos
  withInstallPct: number;
  noInstallValue: number; // valor cotizado sin instalación
  withInstallValue: number;
};

export type CapacityLoad = {
  process: string;
  unitsPerDay: number;
  unitLabel: string;
  // Proyectos activos en producción (proxy de carga)
  activeProductionProjects: number;
};

export type PresidentDashboard = {
  monthLabel: string;
  monthlyGoal: number;
  monthSales: number; // ventas del mes (proyectos creados)
  goalProgress: number; // %
  activeProjects: number;
  completedThisMonth: number;
  totalQuoted: number; // de proyectos activos
  totalCost: number; // costo real agregado de proyectos activos
  totalMargin: number;
  marginPct: number | null;
  pendingApprovals: number;
  overdueProjects: number;
  stages: StageBucket[];
  sellers: SellerStat[];
  installMix: InstallMix;
  capacityLoad: CapacityLoad[];
};

const DAY_MS = 86_400_000;

export async function buildPresidentDashboard(): Promise<PresidentDashboard> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = monthStart.toLocaleDateString("es-PR", { month: "long", year: "numeric" });

  const [stagesDef, monthlyGoal, projects, completedThisMonth, pendingApprovals] = await Promise.all([
    loadProjectStages(),
    getMonthlyGoal(),
    prisma.workProject.findMany({
      where: { archived: false },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.workProject.count({
      where: { completedAt: { gte: monthStart }, archived: false },
    }),
    prisma.workProjectApproval.count({ where: { status: "pending" } }),
  ]);

  // Ventas del mes: proyectos creados este mes.
  const monthSales = projects
    .filter((p) => p.createdAt >= monthStart)
    .reduce((s, p) => s + p.quoted, 0);

  // Buckets por etapa con antigüedad promedio (proxy de cuello de botella).
  const buckets = new Map<string, { count: number; value: number; ageSum: number }>();
  for (const s of stagesDef) buckets.set(s.key, { count: 0, value: 0, ageSum: 0 });

  let overdueProjects = 0;
  for (const p of projects) {
    const b = buckets.get(p.stage) ?? buckets.get(stagesDef[0]?.key ?? "");
    if (b) {
      b.count += 1;
      b.value += p.quoted;
      b.ageSum += (now.getTime() - p.updatedAt.getTime()) / DAY_MS;
    }
    if (p.dueDate && p.dueDate < now && !p.completedAt) overdueProjects += 1;
  }

  const stageBuckets: StageBucket[] = stagesDef.map((s) => {
    const b = buckets.get(s.key)!;
    const avg = b.count > 0 ? b.ageSum / b.count : null;
    return {
      key: s.key,
      label: s.label,
      accent: s.accent,
      count: b.count,
      value: b.value,
      avgDaysInStage: avg,
      bottleneck: false,
    };
  });

  // Marca cuello de botella: etapas (no finales) con la mayor antigüedad promedio
  // y al menos 2 proyectos estancados.
  const closingKey = stagesDef[stagesDef.length - 1]?.key;
  const candidates = stageBuckets.filter(
    (b) => b.key !== closingKey && b.count >= 2 && b.avgDaysInStage != null,
  );
  if (candidates.length > 0) {
    const maxAge = Math.max(...candidates.map((b) => b.avgDaysInStage ?? 0));
    for (const b of stageBuckets) {
      if (b.avgDaysInStage != null && b.avgDaysInStage === maxAge && b.count >= 2 && b.key !== closingKey) {
        b.bottleneck = true;
      }
    }
  }

  // Margen agregado: costo real vs cotizado de proyectos activos.
  let totalQuoted = 0;
  let totalCost = 0;
  const costResults = await Promise.all(projects.map((p) => projectCost(p.id)));
  for (const c of costResults) {
    if (!c) continue;
    totalQuoted += c.quoted;
    totalCost += c.totalCost;
  }
  const totalMargin = totalQuoted - totalCost;
  const marginPct = totalQuoted > 0 ? totalMargin / totalQuoted : null;

  // Metas por vendedor/colaborador: ventas atribuidas a sus proyectos (miembros).
  const sellerMap = new Map<string, SellerStat>();
  for (const p of projects) {
    for (const m of p.members) {
      const cur = sellerMap.get(m.userId) ?? {
        userId: m.userId,
        name: m.user.name,
        projects: 0,
        value: 0,
      };
      cur.projects += 1;
      cur.value += p.quoted;
      sellerMap.set(m.userId, cur);
    }
  }
  const sellers = Array.from(sellerMap.values()).sort((a, b) => b.value - a.value);

  // Mezcla de instalación (meta: 70% sin instalar / 30% con instalación).
  const activeProjects = projects.filter((p) => !p.completedAt);
  const noInstallProjects = activeProjects.filter((p) => p.installationType !== "with_install");
  const withInstallProjects = activeProjects.filter((p) => p.installationType === "with_install");
  const totalActive = activeProjects.length;
  const installMix: InstallMix = {
    noInstall: noInstallProjects.length,
    withInstall: withInstallProjects.length,
    noInstallPct: totalActive > 0 ? Math.round((noInstallProjects.length / totalActive) * 100) : 0,
    withInstallPct: totalActive > 0 ? Math.round((withInstallProjects.length / totalActive) * 100) : 0,
    noInstallValue: noInstallProjects.reduce((s, p) => s + p.quoted, 0),
    withInstallValue: withInstallProjects.reduce((s, p) => s + p.quoted, 0),
  };

  // Carga de capacidad: procesos del taller vs proyectos activos en producción.
  const capacityItems = await prisma.shopCapacity.findMany({ where: { active: true }, orderBy: { process: "asc" } });
  const activeProductionCount = projects.filter((p) => !p.completedAt && p.stage === "production").length;
  const capacityLoad: CapacityLoad[] = capacityItems.map((c) => ({
    process: c.process,
    unitsPerDay: c.unitsPerDay,
    unitLabel: c.unitLabel,
    activeProductionProjects: activeProductionCount,
  }));

  return {
    monthLabel,
    monthlyGoal,
    monthSales,
    goalProgress: monthlyGoal > 0 ? Math.round((monthSales / monthlyGoal) * 100) : 0,
    activeProjects: activeProjects.length,
    completedThisMonth,
    totalQuoted,
    totalCost,
    totalMargin,
    marginPct,
    pendingApprovals,
    overdueProjects,
    stages: stageBuckets,
    sellers,
    installMix,
    capacityLoad,
  };
}
