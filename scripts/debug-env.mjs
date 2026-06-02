import { readFileSync } from "node:fs";
const content = readFileSync(".env.local", "utf-8");
const env = {};
for (const rawLine of content.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx === -1) continue;
  const key = line.slice(0, idx).trim();
  const val = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
  env[key] = val;
}
console.log("Keys found:", Object.keys(env).join(", "));
console.log("SUPABASE_URL:", env.NEXT_PUBLIC_SUPABASE_URL ? env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 40) : "MISSING");
