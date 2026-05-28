/**
 * global-setup.ts
 * Runs BEFORE all test projects. Logs in as admin, employee, and client,
 * then saves auth cookies to tests/.auth/*.json so every test spec can
 * reuse them without re-authenticating.
 */
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR  = path.join(__dirname, '.auth');
const REPORT_DIR = path.join(__dirname, 'report');

const ACCOUNTS = [
  { email: 'admin@printingideaspr.com',    password: 'admin123',    file: 'admin.json'    },
  { email: 'empleado@printingideaspr.com', password: 'empleado123', file: 'empleado.json' },
  { email: 'cliente@printingideaspr.com',  password: 'cliente123',  file: 'cliente.json'  },
] as const;

async function globalSetup(config: FullConfig) {
  // Ensure output directories exist
  [AUTH_DIR, REPORT_DIR, path.join(REPORT_DIR, 'screenshots')].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const baseURL =
    (config.projects.find((p) => p.name !== 'setup')?.use?.baseURL as string | undefined)
    ?? 'http://127.0.0.1:3010';

  const browser = await chromium.launch();

  for (const account of ACCOUNTS) {
    const outPath = path.join(AUTH_DIR, account.file);
    console.log(`[setup] Logging in as ${account.email}…`);

    const context = await browser.newContext();
    const page    = await context.newPage();

    try {
      await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

      await page.fill('input[name="email"]',    account.email);
      await page.fill('input[name="password"]', account.password);
      await page.click('button[type="submit"]');

      // Wait until we leave the login page (redirect to portal/admin/empleado/cliente)
      await page.waitForURL(/\/(portal|admin|empleado|cliente)/, { timeout: 20_000 });

      await context.storageState({ path: outPath });
      console.log(`[setup] ✓ Auth state saved → ${outPath}`);
    } catch (err) {
      console.warn(`[setup] ⚠ Could not log in as ${account.email}: ${err}`);
      // Write empty state so tests can still run (they will see redirects)
      fs.writeFileSync(outPath, JSON.stringify({ cookies: [], origins: [] }));
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

export default globalSetup;
