import pg from "pg";
import { readFileSync } from "node:fs";
const { Client } = pg;

function parseEnv(path) {
  try {
    return readFileSync(path, "utf-8").split(/\r?\n/).reduce((a, l) => {
      const i = l.indexOf("=");
      if (i > 0) a[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
      return a;
    }, {});
  } catch { return {}; }
}
const env = { ...parseEnv(".env"), ...parseEnv(".env.local") };

const client = new Client({
  connectionString: env.DIRECT_URL,
  connectionTimeoutMillis: 8000,
  ssl: { rejectUnauthorized: false }
});
await client.connect();

// Find all stuck sessions blocking Task table
const stuck = await client.query(`
  SELECT pid, state, wait_event_type, wait_event, now() - query_start AS duration, query
  FROM pg_stat_activity
  WHERE state IN ('idle in transaction', 'idle in transaction (aborted)')
     OR (state = 'active' AND wait_event_type = 'Lock' AND query ILIKE '%Task%')
  ORDER BY query_start ASC NULLS LAST
`);

console.log(`Found ${stuck.rows.length} stuck session(s):`);
for (const r of stuck.rows) {
  const dur = r.duration;
  const mins = dur?.minutes ?? 0;
  const secs = dur?.seconds ?? 0;
  console.log(`  PID ${r.pid} | state=${r.state} | wait=${r.wait_event_type}/${r.wait_event}`);
  console.log(`    Query: ${r.query?.slice(0, 120)}`);
  const result = await client.query(`SELECT pg_terminate_backend($1) AS terminated`, [r.pid]);
  console.log(`    → terminated: ${result.rows[0]?.terminated}`);
}

if (stuck.rows.length === 0) {
  console.log("  No stuck sessions found - checking all non-idle...");
  const all = await client.query(`
    SELECT pid, state, wait_event_type, wait_event, query
    FROM pg_stat_activity
    WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
    LIMIT 10
  `);
  for (const r of all.rows) {
    console.log(`  PID ${r.pid} | ${r.state} | ${r.wait_event_type}/${r.wait_event}: ${r.query?.slice(0,100)}`);
  }
}

// Verify Task queries work now
console.log("\nVerifying Task queries...");
const t = Date.now();
try {
  const r = await client.query(`SELECT COUNT(*) as c FROM "Task" WHERE status != 'done'`);
  console.log(`✓ Task count(status!=done): ${r.rows[0].c} in ${Date.now()-t}ms`);
} catch(e) {
  console.error(`✗ Still failing:`, e.message.slice(0,200));
}

await client.end();
