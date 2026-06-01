/**
 * Runs manual_migration.sql against the true Supabase direct DB host
 * (bypasses the pooler and its statement_timeout).
 * Usage: node scripts/run-migration-direct.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually load .env
const envPath = join(__dirname, "../.env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch { /* .env not found */ }

const require = createRequire(import.meta.url);
const { Client } = require("pg");

// Build the true direct URL from the project ref embedded in the pooler URL
// Pooler URL: postgresql://postgres.<ref>:pass@aws-...-pooler.supabase.com:5432/postgres
// Direct URL: postgresql://postgres:pass@db.<ref>.supabase.co:5432/postgres
function buildDirectUrl(poolerUrl) {
  const u = new URL(poolerUrl);
  // username is "postgres.nsmbuohujxbrwuubugzj" in pooler mode
  const parts = u.username.split(".");
  const ref = parts.length > 1 ? parts.slice(1).join(".") : null;
  if (!ref) return poolerUrl; // already direct
  return `postgresql://postgres:${u.password}@db.${ref}.supabase.co:5432/postgres`;
}

const directUrl = buildDirectUrl(process.env.DIRECT_URL || process.env.DATABASE_URL);
console.log("Connecting to direct DB host…");

const sql = readFileSync(join(__dirname, "../prisma/manual_migration.sql"), "utf8");

const client = new Client({
  connectionString: directUrl,
  connectionTimeoutMillis: 30000,
  statement_timeout: 0, // disable timeout for migrations
  options: "-c statement_timeout=0",
});

try {
  await client.connect();
  // Disable statement timeout at session level
  await client.query("SET statement_timeout = 0");
  console.log("Running migration SQL…");
  await client.query(sql);
  console.log("✅ Migration completed successfully.");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
