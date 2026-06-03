import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

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

// Contraseñas simples por rol
const NEW = {
  admin:    "admin123",
  employee: "empleado123",
  client:   "cliente123",
};

// 1. Actualizar hashes en la base de datos
for (const [role, pw] of Object.entries(NEW)) {
  const hash = await bcrypt.hash(pw, 10);
  const res = await prisma.user.updateMany({ where: { role }, data: { password: hash } });
  console.log(`✓ ${res.count} cuenta(s) ${role} → '${pw}'`);
}

await prisma.$disconnect();

// 2. Sincronizar el .env para mantener consistencia
function updateEnvVar(path, key, value) {
  if (!existsSync(path)) return false;
  let content = readFileSync(path, "utf-8");
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, `${key}="${value}"`);
  } else {
    content += `\n${key}="${value}"`;
  }
  writeFileSync(path, content);
  return true;
}

const envTargets = [
  ["ADMIN_PASSWORD", NEW.admin],
  ["SEED_EMPLOYEE_PASSWORD", NEW.employee],
  ["SEED_CLIENT_PASSWORD", NEW.client],
];
for (const [key, value] of envTargets) {
  const ok = updateEnvVar(".env", key, value) || updateEnvVar(".env.local", key, value);
  console.log(ok ? `✓ ${key} actualizado en .env` : `· ${key} no encontrado en .env`);
}

console.log("\nListo. Credenciales nuevas:");
console.log("  admin@printingideaspr.com    → admin123");
console.log("  empleado@printingideaspr.com → empleado123");
console.log("  cliente@printingideaspr.com  → cliente123");
