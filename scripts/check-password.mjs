import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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

const prisma = new PrismaClient({
  datasources: { db: { url: env.DIRECT_URL } },
});

// Test admin password
const admin = await prisma.user.findUnique({ where: { email: "admin@printingideaspr.com" } });
const adminPasswordFromEnv = env.ADMIN_PASSWORD;
const match = await bcrypt.compare(adminPasswordFromEnv, admin.password);
console.log(`Admin password '${adminPasswordFromEnv}' matches DB hash: ${match}`);

// Also test with the seed password format
const seedPasswords = [
  env.ADMIN_PASSWORD,
  "TOiuM_H24kZf5hXUSCdqryiB",
];
for (const pw of seedPasswords) {
  const m = await bcrypt.compare(pw, admin.password);
  console.log(`  '${pw}' → ${m ? "✓ MATCH" : "✗ no match"}`);
}

await prisma.$disconnect();
