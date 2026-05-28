/**
 * tests/api-monitor.spec.ts
 *
 * API failure detection:
 *  • Intercepts every /api/* request made while navigating pages
 *  • Reports 4xx / 5xx responses
 *  • Saves api-calls.json with full details
 *  • Asserts no 5xx errors occur during normal navigation
 */

import { test, expect, BrowserContext } from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import { ADMIN_STATE, ensureDirs, saveJSON, ApiCall } from './utils/report';

const PAGES_TO_TEST = [
  '/admin',
  '/admin/tareas',
  '/admin/proyectos',
  '/admin/cotizaciones',
  '/admin/facturas',
  '/admin/usuarios',
  '/admin/horas',
  '/admin/settings',
  '/empleado',
  '/empleado/horas',
  '/empleado/ponche',
];

test.describe('API Monitor', () => {
  let context: BrowserContext;
  const allCalls: ApiCall[] = [];

  test.beforeAll(async ({ browser }) => {
    ensureDirs();
    const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
    context = await browser.newContext({ storageState: stateFile as string | undefined });
  });

  test.afterAll(async () => {
    saveJSON('api-calls.json', allCalls);

    const failed = allCalls.filter((c) => !c.ok);
    console.log(`\n── API Monitor Summary ─────────────────────────`);
    console.log(`Total API calls intercepted: ${allCalls.length}`);
    console.log(`Failed (4xx/5xx): ${failed.length}`);
    if (failed.length > 0) {
      failed.forEach((c) => console.warn(`  ${c.method} ${c.url} → ${c.status}`));
    }
    console.log(`─────────────────────────────────────────────────\n`);

    await context.close();
  });

  for (const route of PAGES_TO_TEST) {
    test(`monitor API calls on: ${route}`, async () => {
      const page = await context.newPage();
      const pageCalls: ApiCall[] = [];

      // Intercept all /api/* requests
      await page.route('/api/**', async (route) => {
        let bodySnip = '';
        let status   = 0;

        try {
          const resp = await route.fetch();
          status     = resp.status();

          // Sniff body for error messages (first 200 chars)
          const ct = resp.headers()['content-type'] ?? '';
          if (ct.includes('json')) {
            const text = await resp.text().catch(() => '');
            bodySnip   = text.slice(0, 200);
          }

          const call: ApiCall = {
            url:      route.request().url(),
            method:   route.request().method(),
            status,
            ok:       status < 400,
            bodySnip,
          };
          pageCalls.push(call);
          allCalls.push(call);

          await route.fulfill({ response: resp });
        } catch (err) {
          const call: ApiCall = {
            url:      route.request().url(),
            method:   route.request().method(),
            status:   -1,
            ok:       false,
            bodySnip: String(err),
          };
          pageCalls.push(call);
          allCalls.push(call);
          await route.continue();
        }
      });

      await page.goto(route, { waitUntil: 'networkidle', timeout: 25_000 });

      // Also capture XHR / fetch calls triggered by interactions (wait a moment)
      await page.waitForTimeout(2_000);

      const serverErrors = pageCalls.filter((c) => c.status >= 500);
      expect(
        serverErrors,
        `Server errors (5xx) on ${route}:\n${serverErrors.map((c) => `  ${c.method} ${c.url} → ${c.status}`).join('\n')}`,
      ).toHaveLength(0);

      if (pageCalls.length > 0) {
        console.log(`  ${route}: ${pageCalls.length} API calls, ${pageCalls.filter((c) => !c.ok).length} failed`);
      }

      await page.close();
    });
  }

  // ── Explicit API endpoint health checks ──────────────────────────────────

  const HEALTH_ENDPOINTS: { method: string; url: string; expectedStatus: number }[] = [
    { method: 'GET',  url: '/api/auth/session',     expectedStatus: 200 },
    { method: 'GET',  url: '/api/tareas',            expectedStatus: 200 },
    { method: 'GET',  url: '/api/proyectos',         expectedStatus: 200 },
    { method: 'GET',  url: '/api/cotizaciones',      expectedStatus: 200 },
    { method: 'GET',  url: '/api/servicios',         expectedStatus: 200 },
    { method: 'GET',  url: '/api/horarios',          expectedStatus: 200 },
    { method: 'GET',  url: '/api/horas/me',          expectedStatus: 200 },
    { method: 'GET',  url: '/api/site-config',       expectedStatus: 200 },
    { method: 'GET',  url: '/api/settings',          expectedStatus: 200 },
  ];

  test('API endpoint health checks', async () => {
    const page = await context.newPage();

    for (const ep of HEALTH_ENDPOINTS) {
      const resp = await page.request[ep.method.toLowerCase() as 'get' | 'post'](ep.url).catch(() => null);
      if (!resp) {
        console.warn(`  ⚠ ${ep.method} ${ep.url} — request failed`);
        allCalls.push({ url: ep.url, method: ep.method, status: -1, ok: false, bodySnip: 'request failed' });
        continue;
      }
      const ok = resp.status() === ep.expectedStatus || resp.status() < 500;
      allCalls.push({ url: ep.url, method: ep.method, status: resp.status(), ok, bodySnip: '' });
      console.log(`  ${ok ? '✓' : '✗'} ${ep.method} ${ep.url} → ${resp.status()}`);
    }

    const serverErrors = allCalls.filter((c) => c.status >= 500);
    expect(serverErrors, `5xx API errors: ${serverErrors.map((c) => c.url).join(', ')}`).toHaveLength(0);

    await page.close();
  });
});
