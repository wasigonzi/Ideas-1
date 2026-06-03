import { prisma } from "@/lib/prisma";
import { hoursBetween } from "@/lib/time";

// Parámetros globales del motor de precios/costos, guardados en SiteSetting.
export type PricingParams = {
  // Margen aplicado sobre el costo para obtener el precio (ej. 2.5 = 250%).
  markup: number;
  // Costo de tinta por pie² impreso.
  inkCostPerSqFt: number;
};

const DEFAULTS: PricingParams = { markup: 2.5, inkCostPerSqFt: 0.35 };

const KEYS = {
  markup: "pricing.markup",
  ink: "pricing.inkCostPerSqFt",
};

export async function getPricingParams(): Promise<PricingParams> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [KEYS.markup, KEYS.ink] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const markup = parseFloat(map.get(KEYS.markup) ?? "");
  const ink = parseFloat(map.get(KEYS.ink) ?? "");
  return {
    markup: Number.isFinite(markup) && markup > 0 ? markup : DEFAULTS.markup,
    inkCostPerSqFt: Number.isFinite(ink) && ink >= 0 ? ink : DEFAULTS.inkCostPerSqFt,
  };
}

export async function setPricingParams(p: Partial<PricingParams>): Promise<void> {
  const ops = [];
  if (p.markup != null) {
    ops.push(
      prisma.siteSetting.upsert({
        where: { key: KEYS.markup },
        create: { key: KEYS.markup, value: String(p.markup) },
        update: { value: String(p.markup) },
      }),
    );
  }
  if (p.inkCostPerSqFt != null) {
    ops.push(
      prisma.siteSetting.upsert({
        where: { key: KEYS.ink },
        create: { key: KEYS.ink, value: String(p.inkCostPerSqFt) },
        update: { value: String(p.inkCostPerSqFt) },
      }),
    );
  }
  await prisma.$transaction(ops);
}

export type PriceQuote = {
  squareFeet: number;
  materialCostPerSqFt: number;
  inkCostPerSqFt: number;
  materialCost: number;
  inkCost: number;
  baseCost: number;
  markup: number;
  price: number;
};

// Calcula el precio de una pieza por pie² según material y terminación.
export async function quotePrice(opts: {
  materialId: string;
  squareFeet: number;
  // Costo extra de terminación por pie² (laminado, ojetes, etc.).
  finishingCostPerSqFt?: number;
}): Promise<PriceQuote | null> {
  const material = await prisma.material.findUnique({ where: { id: opts.materialId } });
  if (!material) return null;
  const params = await getPricingParams();

  const sqft = Math.max(0, opts.squareFeet);
  const matPerSqFt = material.costPerSqFt + (opts.finishingCostPerSqFt ?? 0);
  const materialCost = matPerSqFt * sqft;
  const inkCost = params.inkCostPerSqFt * sqft;
  const baseCost = materialCost + inkCost;
  const price = baseCost * params.markup;

  return {
    squareFeet: sqft,
    materialCostPerSqFt: matPerSqFt,
    inkCostPerSqFt: params.inkCostPerSqFt,
    materialCost,
    inkCost,
    baseCost,
    markup: params.markup,
    price,
  };
}

export type ProjectCostBreakdown = {
  laborHours: number;
  laborCost: number;
  // Detalle de horas por colaborador con su costo de rol.
  laborByUser: { userId: string; name: string | null; hours: number; rate: number; cost: number }[];
  quoted: number;
  // Costos provistos por la ficha técnica (si existe).
  materialCost: number;
  inkCost: number;
  otherCost: number;
  totalCost: number;
  margin: number; // quoted - totalCost
  marginPct: number | null; // margin / quoted
};

// Calcula el costo real de un proyecto: horas-hombre (desde WorkSessions de sus
// tareas, valoradas con RoleRate por el position/role del usuario) más los
// costos de material/tinta/otros de la ficha técnica.
export async function projectCost(projectId: string): Promise<ProjectCostBreakdown | null> {
  const project = await prisma.workProject.findUnique({
    where: { id: projectId },
    include: { techSheet: true },
  });
  if (!project) return null;

  // Todas las sesiones de trabajo cerradas de tareas del proyecto.
  const sessions = await prisma.workSession.findMany({
    where: { task: { workProjectId: projectId }, endedAt: { not: null } },
    include: { user: { select: { id: true, name: true, position: true, hourlyRate: true } } },
  });

  // Tarifas por rol (por nombre de rol = User.position).
  const roleRates = await prisma.roleRate.findMany();
  const rateByRole = new Map(roleRates.map((r) => [r.role.toLowerCase(), r.hourlyCost]));

  const byUser = new Map<string, { name: string | null; hours: number; rate: number }>();
  for (const s of sessions) {
    if (!s.endedAt) continue;
    const hours = hoursBetween(s.startedAt, s.endedAt);
    const roleRate = s.user.position ? rateByRole.get(s.user.position.toLowerCase()) : undefined;
    const rate = roleRate ?? s.user.hourlyRate ?? 0;
    const cur = byUser.get(s.user.id) ?? { name: s.user.name, hours: 0, rate };
    cur.hours += hours;
    cur.rate = rate;
    byUser.set(s.user.id, cur);
  }

  const laborByUser = Array.from(byUser.entries()).map(([userId, v]) => ({
    userId,
    name: v.name,
    hours: v.hours,
    rate: v.rate,
    cost: v.hours * v.rate,
  }));
  const laborHours = laborByUser.reduce((s, u) => s + u.hours, 0);
  const laborCost = laborByUser.reduce((s, u) => s + u.cost, 0);

  const materialCost = project.techSheet?.materialCost ?? 0;
  const inkCost = project.techSheet?.inkCost ?? 0;
  const otherCost = project.techSheet?.otherCost ?? 0;
  const totalCost = laborCost + materialCost + inkCost + otherCost;
  const quoted = project.quoted;
  const margin = quoted - totalCost;
  const marginPct = quoted > 0 ? margin / quoted : null;

  return {
    laborHours,
    laborCost,
    laborByUser,
    quoted,
    materialCost,
    inkCost,
    otherCost,
    totalCost,
    margin,
    marginPct,
  };
}
