import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando columnas existentes...");
  await prisma.taskColumn.deleteMany({});

  const columns = [
    { key: "todo", label: "Por hacer", accent: "bg-amber-500", position: 1000 },
    { key: "in_progress", label: "En progreso", accent: "bg-violet-500", position: 2000 },
    { key: "review", label: "Para revisión", accent: "bg-sky-500", position: 3000 },
    { key: "produccion", label: "Producción", accent: "bg-orange-500", position: 4000 },
    { key: "blocked", label: "Bloqueadas", accent: "bg-rose-500", position: 5000 },
    { key: "done", label: "Hechas", accent: "bg-emerald-500", position: 6000 },
    { key: "cerrado", label: "Cerrado / Cobrado", accent: "bg-slate-500", position: 7000 }
  ];

  console.log("Insertando columnas por defecto y columna de cerrado...");
  for (const col of columns) {
    await prisma.taskColumn.create({
      data: {
        key: col.key,
        label: col.label,
        accent: col.accent,
        position: col.position
      }
    });
  }

  console.log("✓ Columnas inicializadas correctamente.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
