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

console.log("Testing raw pg connection to pooler (port 6543)...");
const client = new Client({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 8000,
  query_timeout: 8000,
  ssl: { rejectUnauthorized: false }
});

const t0 = Date.now();
try {
  await client.connect();
  console.log(`Connected in ${Date.now()-t0}ms`);
  const r = await client.query('SELECT count(*) as c FROM "Invoice"');
  console.log(`Invoice count: ${r.rows[0].c} in ${Date.now()-t0}ms`);
  await client.end();
} catch(e) {
  console.error(`ERROR (${Date.now()-t0}ms):`, e.message.slice(0, 300));
}
