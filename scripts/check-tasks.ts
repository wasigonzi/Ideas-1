import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== COLUMNAS EN LA BD (TaskColumn) ===");
  const columns = await prisma.taskColumn.findMany({
    orderBy: { position: "asc" }
  });
  console.log(columns.map(c => ({ id: c.id, key: c.key, label: c.label })));

  console.log("\n=== DISTRIBUCIÓN DE ESTADOS EN TAREAS (Task) ===");
  const tasksGrouped = await prisma.task.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  console.log(tasksGrouped);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
