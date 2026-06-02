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

const prisma = new PrismaClient({
  datasources: { db: { url: env.DIRECT_URL } },
});

const users = await prisma.user.findMany({
  select: { email: true, role: true, active: true, password: true }
});

for (const u of users) {
  console.log(`${u.email} | role=${u.role} | active=${u.active} | hash_prefix=${u.password.slice(0, 20)}`);
}

await prisma.$disconnect();
