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

console.log("DATABASE_URL host:", env.DATABASE_URL?.split("@")[1]?.split("/")[0]);
console.log("DIRECT_URL host:", env.DIRECT_URL?.split("@")[1]?.split("/")[0]);

// Test DIRECT connection first
const direct = new PrismaClient({
  datasources: { db: { url: env.DIRECT_URL } },
});

console.log("\n[DIRECT] Testing...");
const t0 = Date.now();
try {
  const result = await direct.$queryRaw`SELECT COUNT(*)::int as c FROM "Invoice"`;
  console.log(`✓ DIRECT invoice count: ${result[0].c} in ${Date.now()-t0}ms`);
} catch(e) {
  console.error(`✗ DIRECT failed (${Date.now()-t0}ms):`, e.message.slice(0,200));
}
await direct.$disconnect();
