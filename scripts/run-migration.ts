/**
 * Runs the manual migration using DIRECT_URL to bypass the pooler statement timeout.
 * Usage: npx tsx scripts/run-migration.ts
 */
import { PrismaClient } from "@prisma/client";

// Load env
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("DIRECT_URL env var is required");
  process.exit(1);
}

const prisma = new PrismaClient({
  // @ts-expect-error override datasource url at runtime
  datasources: { db: { url: directUrl } },
});

const statements = [
  `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS "Task_archived_idx" ON "Task"("archived")`,
  `CREATE TABLE IF NOT EXISTS "TaskMember" (
    "id"      TEXT NOT NULL,
    "taskId"  TEXT NOT NULL,
    "userId"  TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskMember_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TaskMember_taskId_userId_key" ON "TaskMember"("taskId","userId")`,
  `CREATE INDEX IF NOT EXISTS "TaskMember_taskId_idx" ON "TaskMember"("taskId")`,
  `CREATE INDEX IF NOT EXISTS "TaskMember_userId_idx" ON "TaskMember"("userId")`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'TaskMember_taskId_fkey'
    ) THEN
      ALTER TABLE "TaskMember" ADD CONSTRAINT "TaskMember_taskId_fkey"
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'TaskMember_userId_fkey'
    ) THEN
      ALTER TABLE "TaskMember" ADD CONSTRAINT "TaskMember_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "TaskAttachment" (
    "id"        TEXT NOT NULL,
    "taskId"    TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "name"      TEXT,
    "mimeType"  TEXT,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "TaskAttachment_taskId_position_idx" ON "TaskAttachment"("taskId","position")`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'TaskAttachment_taskId_fkey'
    ) THEN
      ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey"
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "TaskChecklistItem" (
    "id"        TEXT NOT NULL,
    "taskId"    TEXT NOT NULL,
    "text"      TEXT NOT NULL,
    "done"      BOOLEAN NOT NULL DEFAULT false,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "TaskChecklistItem_taskId_position_idx" ON "TaskChecklistItem"("taskId","position")`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'TaskChecklistItem_taskId_fkey'
    ) THEN
      ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey"
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

async function main() {
  console.log(`Running ${statements.length} migration statements via DIRECT_URL…\n`);
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i].trim().split("\n")[0].slice(0, 80);
    process.stdout.write(`[${i + 1}/${statements.length}] ${sql}… `);
    try {
      await prisma.$executeRawUnsafe(statements[i]);
      console.log("✓");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // "already exists" errors are fine (idempotent)
      if (msg.includes("already exists")) {
        console.log("(already exists, skipped)");
      } else {
        console.log(`✗ ${msg}`);
        process.exit(1);
      }
    }
  }
  console.log("\nMigration complete.");
}

main().finally(() => prisma.$disconnect());
