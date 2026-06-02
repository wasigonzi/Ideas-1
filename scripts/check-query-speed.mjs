import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

function parseEnvFile(path) {
  try {
    const content = readFileSync(path, "utf-8");
    const result = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
    }
    return result;
  } catch { return {}; }
}
const env = { ...parseEnvFile(".env"), ...parseEnvFile(".env.local") };

// Test against the POOLER (DATABASE_URL) — the one the app uses
const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
  log: ["query"],
});

console.log("Testing admin dashboard queries against DATABASE_URL (pgbouncer)...\n");
const t0 = Date.now();
try {
  const [overdueCount, urgentCount] = await Promise.all([
    prisma.invoice.count({ where: { status: "overdue" } }),
    prisma.task.count({ where: { priority: "urgent", status: { not: "done" } } }),
  ]);
  console.log(`✓ invoice.count(overdue): ${overdueCount} | task.count(urgent): ${urgentCount} | ${Date.now()-t0}ms`);
} catch(e) {
  console.error(`✗ Failed (${Date.now()-t0}ms):`, e.message);
}

// Also test the admin page query
const t1 = Date.now();
try {
  const [quotesNew, tasksOpen] = await Promise.all([
    prisma.quote.count({ where: { status: "new" } }),
    prisma.task.count({ where: { status: { notIn: ["done"] } } }),
  ]);
  console.log(`✓ quote.count(new): ${quotesNew} | task.count(open): ${tasksOpen} | ${Date.now()-t1}ms`);
} catch(e) {
  console.error(`✗ Failed (${Date.now()-t1}ms):`, e.message);
}

await prisma.$disconnect();
