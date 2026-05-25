/**
 * setup-trello-columns.ts
 *
 * 1. Crea las columnas del tablero que reflejan el flujo de trabajo de Trello.
 * 2. Re-mapea el status de cada tarea usando el idList original del JSON de Trello.
 *
 * Uso: npx tsx scripts/setup-trello-columns.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const JSON_PATH = path.join(process.cwd(), "fVF9Cs8O - proyectos-2025-2026.json");

// ─── Nuevas columnas (orden del flujo de trabajo) ────────────────────────────
const NEW_COLUMNS = [
  { key: "pendientes",    label: "Jobs Pendientes",        accent: "bg-amber-500",   position: 1000 },
  { key: "espera",        label: "En Espera",              accent: "bg-yellow-500",  position: 2000 },
  { key: "arte",          label: "Arte / Diseño",          accent: "bg-violet-500",  position: 3000 },
  { key: "produccion",    label: "Producción",             accent: "bg-cyan-500",    position: 4000 },
  { key: "terminaciones", label: "Terminaciones",          accent: "bg-orange-500",  position: 5000 },
  { key: "instalacion",   label: "Instalación / Entrega",  accent: "bg-lime-500",    position: 6000 },
  { key: "facturar",      label: "Facturar",               accent: "bg-sky-500",     position: 7000 },
  { key: "cerrado",       label: "Cerrado / Cobrado",      accent: "bg-emerald-500", position: 8000 },
];

// ─── Mapeo de nombre de lista Trello → clave de columna ──────────────────────
function mapListToColumnKey(listName: string): string {
  const n = listName.toLowerCase();

  // Cerrado / Cobrado
  if (
    n.includes("cerrad") || n.includes("cobrad") || n.includes("completad") ||
    n.includes("facturad") || n.includes("proyectos facturados") ||
    n.includes("quickbooks") || n.includes("documentos oficiales") ||
    n.includes("triple s verif")
  ) return "cerrado";

  // Facturar
  if (n.includes("facturar") || n.includes("listo para entrega") || n.includes("listo para instalar"))
    return "facturar";

  // Instalación / Entrega
  if (n.includes("instalaci") || n.includes("coordinar instalaci"))
    return "instalacion";

  // Terminaciones
  if (n.includes("terminaci") || n.includes("terminaciones"))
    return "terminaciones";

  // Producción
  if (
    n.includes("producción") || n.includes("produccion") ||
    n.includes("suplidor") || n.includes("remoción vinil") || n.includes("remocion vinil") ||
    n.includes("impresion") || n.includes("impresión")
  ) return "produccion";

  // Arte / Diseño
  if (
    n.includes("artes") || n.includes("tráfico") || n.includes("trafico") ||
    n.includes("diseño") || n.includes("arte -") || n.includes("arte–")
  ) return "arte";

  // En Espera
  if (
    n.includes("espera") || n.includes("jsi") || n.includes("muestras") ||
    n.includes("pago") || n.includes("estimado") || n.includes("triple s revisar")
  ) return "espera";

  // Pendientes (fallback)
  return "pendientes";
}

// Remapeo para tareas que no estén en el JSON de Trello (creadas manualmente)
function remapOldStatus(old: string): string {
  const map: Record<string, string> = {
    todo:        "pendientes",
    in_progress: "produccion",
    blocked:     "espera",
    done:        "cerrado",
    review:      "arte",
    produccion:  "produccion",
  };
  return map[old] ?? "pendientes";
}

async function main() {
  console.log("📋 Configurando columnas del tablero Trello...\n");

  // 1. Reemplazar columnas existentes
  const deleted = await prisma.taskColumn.deleteMany({});
  console.log(`✓ ${deleted.count} columnas antiguas eliminadas`);

  await prisma.taskColumn.createMany({ data: NEW_COLUMNS });
  console.log(`✓ ${NEW_COLUMNS.length} columnas creadas:`);
  NEW_COLUMNS.forEach((c) => console.log(`   • ${c.key.padEnd(16)} → ${c.label}`));

  // 2. Cargar JSON de Trello y construir mapa idList → clave
  if (!fs.existsSync(JSON_PATH)) {
    console.warn("\n⚠  No se encontró el JSON de Trello. Usando remapeo por status anterior.");
    await remapByOldStatus();
    return;
  }

  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const board = JSON.parse(raw) as {
    lists: { id: string; name: string; closed: boolean }[];
    cards: { id: string; name: string; idList: string; closed: boolean }[];
  };

  const listKeyMap: Record<string, string> = {};
  for (const l of board.lists ?? []) {
    listKeyMap[l.id] = mapListToColumnKey(l.name);
    console.log(`   Lista: "${l.name}" → ${listKeyMap[l.id]}`);
  }

  // 3. Construir mapa título → clave (solo tarjetas activas)
  const titleToKey: Record<string, string> = {};
  for (const c of board.cards ?? []) {
    if (!c.closed) {
      titleToKey[c.name.trim()] = listKeyMap[c.idList] ?? "pendientes";
    }
  }

  // 4. Actualizar tareas en la BD
  console.log("\n🔄 Actualizando statuses de tareas...");
  const dbTasks = await prisma.task.findMany({ select: { id: true, title: true, status: true } });

  // Group task IDs by target status — then batch with updateMany (much faster)
  const groups: Record<string, string[]> = {};
  for (const t of dbTasks) {
    const newKey = titleToKey[t.title.trim()] ?? remapOldStatus(t.status);
    if (!groups[newKey]) groups[newKey] = [];
    groups[newKey].push(t.id);
  }

  let updated = 0;
  for (const [status, ids] of Object.entries(groups)) {
    const result = await prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });
    updated += result.count;
    console.log(`   ${status.padEnd(16)} ← ${result.count} tareas`);
  }

  console.log(`✓ Total tareas actualizadas: ${updated}`);
  console.log("\n✅ Listo!");

  await prisma.$disconnect();
}

async function remapByOldStatus() {
  const dbTasks = await prisma.task.findMany({ select: { id: true, status: true } });
  // Group by target status for batch update
  const groups: Record<string, string[]> = {};
  for (const t of dbTasks) {
    const newKey = remapOldStatus(t.status);
    if (!groups[newKey]) groups[newKey] = [];
    groups[newKey].push(t.id);
  }
  let updated = 0;
  for (const [status, ids] of Object.entries(groups)) {
    const r = await prisma.task.updateMany({ where: { id: { in: ids } }, data: { status } });
    updated += r.count;
  }
  console.log(`✓ Tareas remapeadas: ${updated}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
