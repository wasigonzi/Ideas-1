/**
 * Script: import-trello-tasks.ts
 *
 * Importa las tarjetas activas de la exportación de Trello
 * (fVF9Cs8O - proyectos-2025-2026.json) como Tasks en la BD.
 *
 * Adicionalmente, importa:
 *   - Adjuntos / Imágenes de las tarjetas (a la tabla TaskAttachment)
 *   - Elementos de listas de verificación / Checklists (a la tabla TaskChecklistItem)
 *
 * Uso:
 *   npx tsx scripts/import-trello-tasks.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

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
  console.log("Leyendo archivo JSON de Trello…");
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Error: No se encontró el archivo JSON en ${JSON_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const board = JSON.parse(raw);

  const cards: any[] = board.cards ?? [];
  const lists: any[] = board.lists ?? [];
  const checklists: any[] = board.checklists ?? [];

  // Construir mapa idList → list name
  const listMap: Record<string, string> = {};
  for (const l of lists) listMap[l.id] = l.name;

  // Construir mapa idCard → checklists
  const cardChecklistsMap = new Map<string, any[]>();
  for (const ch of checklists) {
    if (!cardChecklistsMap.has(ch.idCard)) {
      cardChecklistsMap.set(ch.idCard, []);
    }
    cardChecklistsMap.get(ch.idCard)!.push(ch);
  }

  // Filtrar sólo tarjetas activas (no cerradas)
  const active = cards.filter((c) => !c.closed);
  console.log(`Total tarjetas activas en Trello: ${active.length}`);

  // Obtener títulos ya existentes en la BD local para evitar duplicados
  const existing = await prisma.task.findMany({ select: { title: true } });
  const existingTitles = new Set(existing.map((t) => t.title.trim().toLowerCase()));

  let skipped = 0;
  let position = 1000;

  const tasksToCreate: any[] = [];
  const attachmentsToCreate: any[] = [];
  const checklistItemsToCreate: any[] = [];

  for (const card of active) {
    const title = (card.name as string).trim();
    if (!title) {
      skipped++;
      continue;
    }

    // Evitar duplicados exactos (basado en minúsculas y sin espacios laterales)
    if (existingTitles.has(title.toLowerCase())) {
      skipped++;
      continue;
    }

    // Generar un ID único del lado del cliente para poder asociar relaciones
    const taskId = randomUUID();
    const listName = listMap[card.idList] ?? "";
    const status = mapListToStatus(listName);
    const priority = mapPriority(card.labels ?? []);
    const description = card.desc ? (card.desc as string).substring(0, 4000) : null;
    const dueDate = card.due ? new Date(card.due) : null;

    // 1. Agregar tarea
    tasksToCreate.push({
      id: taskId,
      title,
      description,
      status,
      priority,
      dueDate,
      position: position++,
    });

    // 2. Mapear adjuntos / imágenes
    const cardAttachments: any[] = card.attachments ?? [];
    cardAttachments.forEach((att, attIdx) => {
      if (att.url) {
        attachmentsToCreate.push({
          id: randomUUID(),
          taskId,
          url: att.url,
          name: att.name || `adjunto_${attIdx}`,
          mimeType: att.mimeType || null,
          position: attIdx,
        });
      }
    });

    // 3. Mapear checklists
    const cardChecklists = cardChecklistsMap.get(card.id) ?? [];
    let itemPos = 0;
    for (const ch of cardChecklists) {
      const checkItems = ch.checkItems ?? [];
      for (const item of checkItems) {
        checklistItemsToCreate.push({
          id: randomUUID(),
          taskId,
          text: item.name,
          done: item.state === "complete",
          position: itemPos++,
        });
      }
    }

    existingTitles.add(title.toLowerCase());
  }

  console.log(`Por crear: ${tasksToCreate.length} tareas, ${attachmentsToCreate.length} adjuntos, ${checklistItemsToCreate.length} elementos de checklist.`);

  if (tasksToCreate.length > 0) {
    // Insertar tareas en lotes de 100
    const BATCH = 100;
    let tasksCreated = 0;
    for (let i = 0; i < tasksToCreate.length; i += BATCH) {
      const batch = tasksToCreate.slice(i, i + BATCH);
      const result = await prisma.task.createMany({ data: batch, skipDuplicates: true });
      tasksCreated += result.count;
    }
    console.log(`✓ Tareas insertadas: ${tasksCreated}`);

    // Insertar adjuntos en lotes de 100
    let attachmentsCreated = 0;
    for (let i = 0; i < attachmentsToCreate.length; i += BATCH) {
      const batch = attachmentsToCreate.slice(i, i + BATCH);
      const result = await prisma.taskAttachment.createMany({ data: batch, skipDuplicates: true });
      attachmentsCreated += result.count;
    }
    console.log(`✓ Adjuntos insertados: ${attachmentsCreated}`);

    // Insertar checklists en lotes de 100
    let checklistsCreated = 0;
    for (let i = 0; i < checklistItemsToCreate.length; i += BATCH) {
      const batch = checklistItemsToCreate.slice(i, i + BATCH);
      const result = await prisma.taskChecklistItem.createMany({ data: batch, skipDuplicates: true });
      checklistsCreated += result.count;
    }
    console.log(`✓ Checklists insertados: ${checklistsCreated}`);
  }

  console.log(`\nImportación finalizada con éxito.`);
  console.log(`- Tareas creadas: ${tasksToCreate.length}`);
  console.log(`- Tareas omitidas: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Error en la importación:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
