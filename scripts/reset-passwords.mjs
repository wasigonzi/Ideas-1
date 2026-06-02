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

const adminEmail = env.ADMIN_EMAIL || "admin@printingideaspr.com";
const adminPassword = env.ADMIN_PASSWORD;
const employeePassword = env.SEED_EMPLOYEE_PASSWORD;
const clientPassword = env.SEED_CLIENT_PASSWORD;

if (!adminPassword) { console.error("ADMIN_PASSWORD not found in env"); process.exit(1); }

const adminHash = await bcrypt.hash(adminPassword, 10);
const updated = await prisma.user.update({
  where: { email: adminEmail },
  data: { password: adminHash },
  select: { email: true }
});
console.log(`✓ Reset password for ${updated.email}`);

// Also reset seed employees/clients if their passwords are in env
if (employeePassword) {
  const empHash = await bcrypt.hash(employeePassword, 10);
  const employees = await prisma.user.updateMany({
    where: { role: "employee" },
    data: { password: empHash }
  });
  console.log(`✓ Reset password for ${employees.count} employee(s) → '${employeePassword}'`);
}

if (clientPassword) {
  const cliHash = await bcrypt.hash(clientPassword, 10);
  const clients = await prisma.user.updateMany({
    where: { role: "client" },
    data: { password: cliHash }
  });
  console.log(`✓ Reset password for ${clients.count} client(s) → '${clientPassword}'`);
}

await prisma.$disconnect();
console.log("\nDone. Passwords reset to match .env values.");
