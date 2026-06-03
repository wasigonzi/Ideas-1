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

const email = (process.argv[2] || "empleado@printingideaspr.com").toLowerCase();
const candidates = [
  process.argv[3],
  env.ADMIN_PASSWORD,
  env.EMPLOYEE_PASSWORD,
  env.SEED_EMPLOYEE_PASSWORD,
  env.CLIENT_PASSWORD,
  env.E2E_ADMIN_PASSWORD,
  env.E2E_CLIENT_PASSWORD,
].filter(Boolean);

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.log(`NO existe usuario con email: ${email}`);
} else {
  console.log(`Usuario: ${user.email} | role=${user.role} | active=${user.active}`);
  console.log(`Hash: ${user.password}`);
  console.log("Probando contraseñas candidatas:");
  for (const pw of candidates) {
    const m = await bcrypt.compare(pw, user.password);
    console.log(`  '${pw}' → ${m ? "✓ MATCH" : "✗ no match"}`);
  }
}

await prisma.$disconnect();
