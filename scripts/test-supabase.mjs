import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Parse env files (.env.local overrides .env)
function parseEnvFile(path) {
  try {
    const content = readFileSync(path, "utf-8");
    const result = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
      result[key] = val;
    }
    return result;
  } catch { return {}; }
}

const env = {
  ...parseEnvFile(resolve(process.cwd(), ".env")),
  ...parseEnvFile(resolve(process.cwd(), ".env.local")),
};

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("SUPABASE_URL:", url ? "✓ SET" : "✗ MISSING");
console.log("SERVICE_ROLE_KEY:", serviceKey ? "✓ SET" : "✗ MISSING");
console.log("ANON/PUBLISHABLE_KEY:", anonKey ? "✓ SET" : "✗ MISSING");
console.log("");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1. Test storage buckets
console.log("=== Storage Buckets ===");
const { data: buckets, error: bucketsErr } = await admin.storage.listBuckets();
if (bucketsErr) {
  console.error("✗ Error:", bucketsErr.message);
} else {
  for (const b of buckets) {
    console.log(`  Bucket: ${b.id} | public: ${b.public} | allowed MIME: ${b.allowed_mime_types ?? "any"}`);
  }
  const uploadsBucket = buckets.find((b) => b.id === "uploads");
  if (!uploadsBucket) {
    console.warn("✗ 'uploads' bucket NOT FOUND — file uploads will fail!");
  } else {
    console.log("✓ 'uploads' bucket exists, public:", uploadsBucket.public);
  }
}

// 2. Test DB access via service role (bypasses RLS)
console.log("\n=== Database (service role) ===");
const { data: users, error: usersErr } = await admin.from("User").select("id, email, role").limit(3);
if (usersErr) {
  console.error("✗ DB error:", usersErr.message);
} else {
  console.log(`✓ DB accessible — ${users.length} user(s) returned`);
  for (const u of users) console.log(`  ${u.email} (${u.role})`);
}

// 3. Test realtime publication
console.log("\n=== Realtime Publication ===");
const { data: realtimeCheck, error: realtimeErr } = await admin.rpc("pg_catalog.pg_publication", {}).select?.("*") ?? {};
console.log("  (realtime publication status must be verified in Supabase SQL Editor — run scripts/supabase-enable-realtime.sql if not done yet)");

// 4. Test anon client connectivity
console.log("\n=== Anon Client Connectivity ===");
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: anonData, error: anonErr } = await anon.from("User").select("id").limit(1);
if (anonErr) {
  if (anonErr.message.includes("permission") || anonErr.code === "PGRST301" || anonErr.code === "42501") {
    console.log("✓ Anon client connects (RLS blocking data access as expected)");
  } else {
    console.error("✗ Anon client error:", anonErr.message, "code:", anonErr.code);
  }
} else {
  console.log("⚠ Anon client returned data without RLS — consider enabling RLS on User table");
}

console.log("\nDone.");
