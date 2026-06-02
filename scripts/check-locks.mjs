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

// Check for blocking queries / locks on Task table
const locks = await client.query(`
  SELECT 
    pid, 
    now() - query_start AS duration,
    wait_event_type,
    wait_event,
    state,
    query
  FROM pg_stat_activity
  WHERE state != 'idle'
    AND query NOT ILIKE '%pg_stat_activity%'
  ORDER BY duration DESC NULLS LAST
  LIMIT 20
`);
console.log("=== Active Queries ===");
console.log(locks.rows.length, "active query/queries:");
for (const r of locks.rows) {
  console.log(`  PID ${r.pid} | state=${r.state} | wait=${r.wait_event_type}/${r.wait_event} | duration=${r.duration}`);
  console.log(`    ${r.query?.slice(0, 100)}`);
}

// Check for locks specifically
const tableLocks = await client.query(`
  SELECT 
    l.pid,
    c.relname AS table_name,
    l.mode,
    l.granted,
    a.query,
    now() - a.query_start AS duration
  FROM pg_locks l
  JOIN pg_class c ON c.oid = l.relation
  JOIN pg_stat_activity a ON a.pid = l.pid
  WHERE c.relname IN ('Task', 'Invoice', 'Quote', 'User', 'SiteSetting')
    AND l.granted = false
  LIMIT 20
`);
console.log("\n=== Blocked Locks on Key Tables ===");
if (tableLocks.rows.length === 0) {
  console.log("  No blocked locks found.");
} else {
  for (const r of tableLocks.rows) {
    console.log(`  PID ${r.pid} | ${r.table_name} | mode=${r.mode} | granted=${r.granted} | ${r.query?.slice(0,80)}`);
  }
}

// Check indexes on Task table
const indexes = await client.query(`
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'Task'
  ORDER BY indexname
`);
console.log("\n=== Task Table Indexes ===");
for (const r of indexes.rows) {
  console.log(`  ${r.indexname}: ${r.indexdef}`);
}

// Quick explain plan for the problematic query
const explain = await client.query(`
  EXPLAIN (FORMAT TEXT, ANALYZE FALSE) 
  SELECT COUNT(*) FROM "Task" WHERE status != 'done'
`);
console.log("\n=== EXPLAIN for task.count(status != done) ===");
for (const r of explain.rows) {
  console.log(" ", r["QUERY PLAN"]);
}

await client.end();
