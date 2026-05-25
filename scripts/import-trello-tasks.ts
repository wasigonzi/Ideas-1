/**
 * Script: import-trello-tasks.ts
 *
 * Importa las tarjetas activas de la exportación de Trello
 * (fVF9Cs8O - proyectos-2025-2026.json) como Tasks en la BD.
 *
 * Uso:
 *   npx tsx scripts/import-trello-tasks.ts
 *
 * Sólo importa tarjetas NO cerradas (closed = false).
 * Mapea la lista de Trello al status más cercano en el sistema.
 * Si la tarea ya existe (mismo título) la omite para evitar duplicados.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// ── Ruta al JSON exportado de Trello ────────────────────────────────────────
const JSON_PATH = path.join(
  process.cwd(),
  "fVF9Cs8O - proyectos-2025-2026.json"
);

// ── Mapeo: nombre de lista Trello → status interno ──────────────────────────
function mapListToStatus(listName: string): string {
  const n = listName.toLowerCase();
  if (
    n.includes("terminad") ||
    n.includes("cerrad") ||
    n.includes("cobrad") ||
    n.includes("facturad") ||
    n.includes("completad") ||
    n.includes("entregad")
  )
    return "done";
  if (
    n.includes("producción") ||
    n.includes("produccion") ||
    n.includes("instalaci") ||
    n.includes("terminacion") ||
    n.includes("terminación") ||
    n.includes("artes") ||
    n.includes("tráfico") ||
    n.includes("trafico") ||
    n.includes("arte") ||
    n.includes("impresión") ||
    n.includes("impresion")
  )
    return "in_progress";
  if (
    n.includes("bloqueado") ||
    n.includes("espera") ||
    n.includes("pendiente") ||
    n.includes("muestras") ||
    n.includes("estimado") ||
    n.includes("jsi") ||
    n.includes("pago")
  )
    return "blocked";
  return "todo";
}

// ── Mapeo: prioridad desde etiquetas Trello ──────────────────────────────────
function mapPriority(labels: { name: string; color: string }[]): string {
  for (const l of labels) {
    const n = (l.name || "").toLowerCase();
    if (n.includes("priority") || n.includes("prioridad")) return "high";
  }
  return "normal";
}

async function main() {
  console.log("Leyendo archivo JSON…");
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const board = JSON.parse(raw);

  const cards: any[] = board.cards ?? [];
  const lists: any[] = board.lists ?? [];

  // Construir mapa idList → list name
  const listMap: Record<string, string> = {};
  for (const l of lists) listMap[l.id] = l.name;

  // Filtrar sólo tarjetas activas (no cerradas)
  const active = cards.filter((c) => !c.closed);
  console.log(`Total tarjetas activas: ${active.length}`);

  // Obtener títulos ya existentes para evitar duplicados
  const existing = await prisma.task.findMany({ select: { title: true } });
  const existingTitles = new Set(existing.map((t) => t.title));

  let skipped = 0;
  let position = 1000;
  const toCreate: {
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    position: number;
  }[] = [];

  for (const card of active) {
    const title = (card.name as string).trim();
    if (!title) { skipped++; continue; }

    // Evitar duplicados exactos
    if (existingTitles.has(title)) {
      skipped++;
      continue;
    }

    const listName = listMap[card.idList] ?? "";
    const status = mapListToStatus(listName);
    const priority = mapPriority(card.labels ?? []);
    const description = card.desc
      ? (card.desc as string).substring(0, 2000)
      : null;
    const dueDate = card.due ? new Date(card.due) : null;

    toCreate.push({ title, description, status, priority, dueDate, position: position++ });
    existingTitles.add(title);
  }

  // Insertar en lotes de 100
  const BATCH = 100;
  let created = 0;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH);
    const result = await prisma.task.createMany({ data: batch, skipDuplicates: true });
    created += result.count;
    console.log(`  Insertados ${created}/${toCreate.length}…`);
  }

  console.log(`✓ Tareas creadas: ${created}`);
  console.log(`⊘ Omitidas (duplicadas o sin título): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
