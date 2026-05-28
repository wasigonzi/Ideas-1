/**
 * tests/empleado.spec.ts
 *
 * Tests every employee portal page:
 *  • Pages load correctly with employee auth
 *  • No JS errors
 *  • Punch clock widget renders
 *  • Screenshots saved
 *  • Employee cannot access admin-only routes (403/redirect)
 */

import { test, expect, BrowserContext } from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import { EMP_STATE, SHOT_DIR, ensureDirs, saveJSON, PageError } from './utils/report';

const SHOT = path.join(SHOT_DIR, 'empleado');

const EMP_PAGES: { route: string; expectText?: RegExp }[] = [
  { route: '/empleado',          expectText: /bienvenido|tareas|nómina|mis/i },
  { route: '/empleado/tareas',   expectText: /tarea/i },
  { route: '/empleado/horas',    expectText: /nómina|hora|período/i },
  { route: '/empleado/ponche',   expectText: /ponche|entrada|salida/i },
  { route: '/empleado/horario',  expectText: /horario/i },
  { route: '/empleado/chat',     expectText: /chat|mensaje/i },
];

const ADMIN_ONLY = [
  '/admin',
  '/admin/usuarios',
  '/admin/facturas',
];

test.describe('Empleado Portal', () => {
  let context: BrowserContext;
  const errors: PageError[] = [];

  test.beforeAll(async ({ browser }) => {
    ensureDirs();
    if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
    const stateFile = fs.existsSync(EMP_STATE) ? EMP_STATE : undefined;
    context = await browser.newContext({ storageState: stateFile as string | undefined });
  });

  test.afterAll(async () => {
    saveJSON('empleado-errors.json', errors);
    await context.close();
  });

  // ── Per-page tests ────────────────────────────────────────────────────────

  for (const { route, expectText } of EMP_PAGES) {
    test(`empleado page loads: ${route}`, async () => {
      const page = await context.newPage();
      const jsErrors: string[] = [];
      page.on('pageerror', (e) => jsErrors.push(e.message));
      page.on('console',  (m) => { if (m.type() === 'error') jsErrors.push(m.text()); });

      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      expect(page.url()).not.toContain('/login');

      if (expectText) {
        await expect(page.locator('body')).toContainText(expectText, { timeout: 8_000 });
      }

      const errorBanner = page.locator('text=/Internal Server Error|500/i');
      await expect(errorBanner).toHaveCount(0);

      const safe = route.replace(/\//g, '-').slice(1);
      await page.screenshot({ path: path.join(SHOT, `${safe}.png`), fullPage: true });

      for (const e of jsErrors) {
        errors.push({ url: route, type: 'js-error', message: e, ts: new Date().toISOString() });
      }
      expect(jsErrors, `JS errors on ${route}:\n${jsErrors.join('\n')}`).toHaveLength(0);
      await page.close();
    });
  }

  // ── Punch clock widget ────────────────────────────────────────────────────

  test('ponche — clock widget shows current time', async () => {
    const page = await context.newPage();
    await page.goto('/empleado/ponche', { waitUntil: 'domcontentloaded' });

    // Punch clock shows a time (HH:MM format)
    await expect(page.locator('body')).toContainText(/\d{1,2}:\d{2}/);

    // Action button (Entrada / Salida) must be visible
    const btn = page.locator('button:has-text("Entrada"), button:has-text("Salida"), button:has-text("Ponche")').first();
    await expect(btn).toBeVisible({ timeout: 5_000 });

    await page.screenshot({ path: path.join(SHOT, 'ponche-widget.png') });
    await page.close();
  });

  // ── Access control ────────────────────────────────────────────────────────

  for (const adminRoute of ADMIN_ONLY) {
    test(`access control: employee cannot access ${adminRoute}`, async () => {
      const page = await context.newPage();

      await page.goto(adminRoute, { waitUntil: 'domcontentloaded', timeout: 15_000 });

      // Should either redirect to login, to empleado, or show a forbidden page
      const url = page.url();
      const isBlocked = url.includes('/login') || url.includes('/empleado') || url.includes('/403');
      expect(isBlocked, `Employee accessed admin-only route: ${adminRoute} → ${url}`).toBeTruthy();

      await page.close();
    });
  }
});
