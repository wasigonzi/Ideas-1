// Siembra solo el catálogo de costos (materiales, tarifas por rol, capacidad)
// y los parámetros globales de precio/meta. Es idempotente: no duplica datos
// y no toca usuarios, facturas ni mensajes. Uso: node scripts/seed-catalog.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const materiales = [
  { name: "D-Board 3mm", category: "d-board", thickness: "3mm", costPerSqFt: 1.85, unit: "ft2" },
  { name: "D-Board 5mm", category: "d-board", thickness: "5mm", costPerSqFt: 2.40, unit: "ft2" },
  { name: "PVC Sintra 3mm", category: "pvc", thickness: "3mm", costPerSqFt: 2.10, unit: "ft2" },
  { name: 'Acrílico transparente 1/8"', category: "acrilico", thickness: '1/8"', costPerSqFt: 5.50, unit: "ft2" },
  { name: "Banner 13oz", category: "banner", thickness: null, costPerSqFt: 0.65, unit: "ft2" },
  { name: "Banner mesh", category: "mesh", thickness: null, costPerSqFt: 0.80, unit: "ft2" },
  { name: "Vinil adhesivo brillante", category: "vinil", thickness: null, costPerSqFt: 0.95, unit: "ft2" },
  { name: "Vinil microperforado", category: "microperforado", thickness: null, costPerSqFt: 1.20, unit: "ft2" },
  { name: "Static cling", category: "static-cling", thickness: null, costPerSqFt: 1.40, unit: "ft2" },
];

const tarifas = [
  { role: "Instalador Sr.", hourlyCost: 28, notes: "Instalación y rotulación en sitio" },
  { role: "Operador Impresión", hourlyCost: 24, notes: "Impresión digital y laminado" },
  { role: "Diseñadora", hourlyCost: 26, notes: "Arte y preprensa" },
  { role: "Técnico de manufactura", hourlyCost: 22, notes: "Corte, ensamblaje y terminaciones" },
  { role: "Wrapper", hourlyCost: 30, notes: "Vehicle wraps" },
];

const capacidades = [
  { process: "Impresión D-Board 3mm", unitsPerDay: 300, unitLabel: "planchas", notes: "Ejemplo de la visión: 300 planchas/día" },
  { process: "Laminado", unitsPerDay: 250, unitLabel: "planchas" },
  { process: "Corte CNC", unitsPerDay: 120, unitLabel: "piezas" },
  { process: "Instalación en flota", unitsPerDay: 8, unitLabel: "unidades" },
];

const settings = [
  { key: "pricing.markup", value: "2.5" },
  { key: "pricing.inkCostPerSqFt", value: "0.35" },
  { key: "intel.monthlyGoal", value: "300000" },
];

for (const m of materiales) {
  const existing = await prisma.material.findFirst({ where: { name: m.name } });
  if (!existing) await prisma.material.create({ data: m });
}
for (const t of tarifas) {
  await prisma.roleRate.upsert({ where: { role: t.role }, update: { hourlyCost: t.hourlyCost, notes: t.notes }, create: t });
}
for (const c of capacidades) {
  const existing = await prisma.shopCapacity.findFirst({ where: { process: c.process } });
  if (!existing) await prisma.shopCapacity.create({ data: c });
}
for (const s of settings) {
  await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s });
}

const [nm, nr, nc] = await Promise.all([
  prisma.material.count(),
  prisma.roleRate.count(),
  prisma.shopCapacity.count(),
]);
console.log(`Catálogo sembrado: ${nm} materiales, ${nr} tarifas, ${nc} capacidades.`);
await prisma.$disconnect();
