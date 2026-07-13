// One-off, idempotent seed: populates ColumnChecklistTemplate rows for the
// 12-stage Trello flow + 9 production sub-phases from PROP-OPS-001
// (Propuesta de Estandarización Operativa). Safe to re-run — columns that
// already have templates are skipped so it never duplicates rows.
//
// Run with: npx tsx prisma/seed-column-checklists.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEMPLATES: Record<string, string[]> = {
  "01_estimado": [
    "Alcance, materiales y precio definidos con el cliente",
    "Propuesta económica (estimado) enviada al cliente",
  ],
  "02_espera_de_deposito": [
    "Depósito del cliente confirmado (Financial Lock)",
    "Ningún archivo de diseño abierto ni tiempo asignado antes de confirmar el pago",
  ],
  "03_job_site_inspection_medidas": [
    "Medidas físicas reales tomadas en el sitio (Technical Lock)",
    "Fotos del lugar documentadas",
    "Medidas guardadas en carpeta 05.Site Inspection",
  ],
  "04_diseno_y_creacion_pre_prensa": [
    "Diseño basado en medidas confirmadas (no en estimaciones)",
    "Archivo cumple estándares de pre-prensa (bleed 1.25\", resolución, modo CMYK, tipografías incrustadas)",
    "Nomenclatura de archivo y carpeta correcta",
  ],
  "05_hoja_de_aprobacion": [
    "Hoja técnica de aprobación preparada (medidas, resolución, modo de color, material, acabados)",
    "Hoja de aprobación enviada al cliente",
  ],
  "06_espera_de_aprobacion": [
    "Aprobación física o digital firmada recibida (Legal Sign-off)",
    "Cambios posteriores congelados (sin costo adicional)",
  ],
  "07_transito_y_trafico": [
    "Disponibilidad de material verificada en stock",
    "Si falta material, tarjeta movida a Espera de Compra de Material",
    "Insumos confirmados antes de iniciar producción",
  ],
  "08_produccion": [
    "Hoja de Aprobación de Arte lista y verificada",
    "Tiling y Nesting completado (paños exportados a resolución constante)",
    "Puntos de Registro / Dielines insertados (CNC-Plotter)",
    "Preparación e Impresión completada",
    "Curado y Desgasificación cumplido (mínimo 1h urgencias / 16-24h saturación alta)",
    "Laminación realizada",
    "Corte Final ejecutado (manual o digital)",
    "Depilado y Aplicación de Transfer completado",
    "Empaque, Rotulación y QC realizado",
  ],
  "09_coordinacion_de_instalacion": [
    "Fecha y lugar confirmados con el cliente",
    "Técnicos instaladores y equipo asignados",
    "Acceso al sitio confirmado con anticipación",
  ],
  "10_instalacion_entrega": [
    "Montaje o entrega física ejecutado",
    "Fotos del resultado final tomadas para portafolio",
  ],
  "11_facturacion_final_y_cobro": [
    "Balance pendiente cobrado (comúnmente 50% restante)",
    "Proyecto no cerrado hasta cobro completo",
  ],
  "12_facturados_y_cerrados": [
    "Archivo completo guardado: arte, aprobaciones, fotos de instalación",
    "Proyecto archivado históricamente",
  ],
  // 13_sin_clasificar_trello intentionally has no templates: it's the legacy
  // catch-all bucket for cards not yet triaged into the real flow, and should
  // never gate or auto-generate anything.
};

async function main() {
  for (const [key, items] of Object.entries(TEMPLATES)) {
    const column = await prisma.taskColumn.findUnique({ where: { key } });
    if (!column) {
      console.warn(`skip: no TaskColumn with key "${key}"`);
      continue;
    }
    const existing = await prisma.columnChecklistTemplate.count({ where: { columnId: column.id } });
    if (existing > 0) {
      console.log(`skip "${column.label}": already has ${existing} template item(s)`);
      continue;
    }
    await prisma.columnChecklistTemplate.createMany({
      data: items.map((itemText, i) => ({
        columnId: column.id,
        itemText,
        itemOrder: (i + 1) * 10,
      })),
    });
    console.log(`seeded "${column.label}": ${items.length} item(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
