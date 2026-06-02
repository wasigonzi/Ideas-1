import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Parse both env files
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

// Use DIRECT_URL to avoid pgbouncer statement timeout on system catalog queries
const prisma = new PrismaClient({
  datasources: { db: { url: env.DIRECT_URL } },
});
try {
  const pub = await prisma.$queryRaw`
    SELECT pubname, puballtables FROM pg_publication WHERE pubname = 'supabase_realtime'
  `;
  if (pub.length === 0) {
    console.log("MISSING: supabase_realtime publication NOT configured — realtime will not work!");
    console.log("  → Run scripts/supabase-enable-realtime.sql in the Supabase SQL Editor");
  } else {
    console.log("OK: supabase_realtime publication exists:", JSON.stringify(pub[0]));
  }
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename
  `;
  console.log("Tables in publication:", tables.map(t => t.tablename).join(", ") || "(none — run the SQL script!)");

  const replicas = await prisma.$queryRaw`
    SELECT relname FROM pg_class
    WHERE relreplident = 'f'
    AND relname IN ('Task','TaskColumn','TaskComment','ChatMessage','ChatRoom','Order','Invoice','Quote','User','Punch','TimeEntry','Shift','WorkSession','DailyNote','Project','Service','SiteSetting','ApprovalSheet')
    ORDER BY relname
  `;
  console.log("Tables with REPLICA IDENTITY FULL:", replicas.map(r => r.relname).join(", ") || "(none)");
} finally {
  await prisma.$disconnect();
}
