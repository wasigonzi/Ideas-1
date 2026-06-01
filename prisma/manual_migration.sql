-- Add archived column to Task (fast path: no table rewrite in PG11+)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Task_archived_idx" ON "Task"("archived");

-- TaskMember table
CREATE TABLE IF NOT EXISTS "TaskMember" (
  "id"      TEXT NOT NULL,
  "taskId"  TEXT NOT NULL,
  "userId"  TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TaskMember_taskId_userId_key" ON "TaskMember"("taskId","userId");
CREATE INDEX IF NOT EXISTS "TaskMember_taskId_idx" ON "TaskMember"("taskId");
CREATE INDEX IF NOT EXISTS "TaskMember_userId_idx" ON "TaskMember"("userId");
ALTER TABLE "TaskMember" DROP CONSTRAINT IF EXISTS "TaskMember_taskId_fkey";
ALTER TABLE "TaskMember" ADD CONSTRAINT "TaskMember_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskMember" DROP CONSTRAINT IF EXISTS "TaskMember_userId_fkey";
ALTER TABLE "TaskMember" ADD CONSTRAINT "TaskMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TaskAttachment table
CREATE TABLE IF NOT EXISTS "TaskAttachment" (
  "id"        TEXT NOT NULL,
  "taskId"    TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "name"      TEXT,
  "mimeType"  TEXT,
  "position"  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TaskAttachment_taskId_position_idx" ON "TaskAttachment"("taskId","position");
ALTER TABLE "TaskAttachment" DROP CONSTRAINT IF EXISTS "TaskAttachment_taskId_fkey";
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TaskChecklistItem table
CREATE TABLE IF NOT EXISTS "TaskChecklistItem" (
  "id"        TEXT NOT NULL,
  "taskId"    TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "done"      BOOLEAN NOT NULL DEFAULT false,
  "position"  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TaskChecklistItem_taskId_position_idx" ON "TaskChecklistItem"("taskId","position");
ALTER TABLE "TaskChecklistItem" DROP CONSTRAINT IF EXISTS "TaskChecklistItem_taskId_fkey";
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
