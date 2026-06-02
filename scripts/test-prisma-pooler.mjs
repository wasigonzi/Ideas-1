import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

function parseEnv(path) {
  try {
    return readFileSync(path, "utf-8").split(/\r?\n/).reduce((a, l) => {
      const i = l.indexOf("=");
      if (i > 0) a[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
      return a;
    }, {});
  } catch { return {}; }
}
const env = { ...parseEnv(".env"), ...parseEnv(".env.local") };

console.log("DATABASE_URL port:", env.DATABASE_URL?.includes("6543") ? "6543 (pgbouncer)" : env.DATABASE_URL?.includes("5432") ? "5432 (direct)" : "unknown");
console.log("Creating Prisma client...");

const p = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});

console.log("Querying invoice count...");
const t0 = Date.now();
try {
  const r = await p.invoice.count();
  console.log(`✓ count=${r} in ${Date.now()-t0}ms`);
} catch(e) {
  console.error(`✗ ERROR in ${Date.now()-t0}ms:`, e.message.slice(0, 300));
}
await p.$disconnect();
console.log("Done.");
