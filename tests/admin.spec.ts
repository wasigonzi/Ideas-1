/**
 * tests/admin.spec.ts
 *
 * Tests every admin portal page:
 *  • Page loads without JS errors
 *  • No error banners / crash UIs visible
 *  • Key UI elements are present
 *  • Screenshots saved for each page
 *  • Broken button detection (clicks each interactive button, checks for errors)
 */

import { test, expect, BrowserContext } from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import { ADMIN_STATE, SHOT_DIR, ensureDirs, saveJSON, PageError } from './utils/report';

const SHOT = path.join(SHOT_DIR, 'admin');

const ADMIN_PAGES: { route: string; expectText?: RegExp }[] = [
  { route: '/admin',                expectText: /dashboard|bienvenido|hoy|tareas/i },
  { route: '/admin/tareas',         expectText: /tareas|producción/i },
  { route: '/admin/proyectos',      expectText: /proyecto/i },
  { route: '/admin/usuarios',       expectText: /usuario/i },
  { route: '/admin/cotizaciones',   expectText: /cotizaci/i },
  { route: '/admin/facturas',       expectText: /factura/i },
  { route: '/admin/horarios',       expectText: /horario/i },
  { route: '/admin/horas',          expectText: /hora/i },
  { route: '/admin/instrucciones',  expectText: /instrucción|instrucciones/i },
  { route: '/admin/chat',           expectText: /chat|mensaje/i },
  { route: '/admin/ordenes',        expectText: /orden/i },
  { route: '/admin/servicios',      expectText: /servicio/i },
  { route: '/admin/settings',       expectText: /configuración|settings/i },
];

// ── Setup ──────────────────────────────────────────────────────────────────────

test.describe('Admin Portal', () => {
  let context: BrowserContext;
  const errors: PageError[] = [];

  test.beforeAll(async ({ browser }) => {
    ensureDirs();
    if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
    const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
    context = await browser.newContext({ storageState: stateFile as string | undefined });
  });

  test.afterAll(async () => {
    saveJSON('admin-errors.json', errors);
    await context.close();
  });

  // ── Per-page tests ──────────────────────────────────────────────────────────

  for (const { route, expectText } of ADMIN_PAGES) {
    test(`admin page loads: ${route}`, async () => {
      const page      = await context.newPage();
      const jsErrors: string[] = [];

      page.on('pageerror', (e) => jsErrors.push(e.message));
      page.on('console',  (m) => { if (m.type() === 'error') jsErrors.push(m.text()); });

      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });

      // Must not redirect to login
      expect(page.url()).not.toContain('/login');

      // Key content check
      if (expectText) {
        await expect(page.locator('body')).toContainText(expectText, { timeout: 8_000 });
      }

      // No generic crash / error UI
      const errorBanner = page.locator('text=/Internal Server Error|Something went wrong|500/i');
      await expect(errorBanner).toHaveCount(0);

      // Screenshot
      const safe = route.replace(/\//g, '-').slice(1) || 'index';
      await page.screenshot({ path: path.join(SHOT, `${safe}.png`), fullPage: true });

      // Accumulate
      for (const e of jsErrors) {
        errors.push({ url: route, type: 'js-error', message: e, ts: new Date().toISOString() });
      }

      expect(jsErrors, `JS errors on ${route}:\n${jsErrors.join('\n')}`).toHaveLength(0);
      await page.close();
    });
  }

  // ── Broken button detection ─────────────────────────────────────────────────

  test('admin/tareas — click toolbar buttons, detect broken ones', async () => {
    const page      = await context.newPage();
    const jsErrors: string[] = [];
    page.on('pageerror', (e) => jsErrors.push(e.message));

    await page.goto('/admin/tareas', { waitUntil: 'domcontentloaded' });

    // Collect all visible, non-disabled buttons
    const buttons = page.locator('button:visible:not([disabled])');
    const count   = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      const txt = await btn.textContent().catch(() => '');
      // Skip destructive buttons (delete, eliminar, borrar)
      if (/eliminar|borrar|delete/i.test(txt ?? '')) continue;

      try {
        await btn.click({ timeout: 3_000, force: false });
        await page.waitForTimeout(400);
      } catch { /* button may have become stale or hidden */ }
    }

    await page.screenshot({ path: path.join(SHOT, 'tareas-buttons.png') });

    // After clicking buttons there should be no JS crashes
    for (const e of jsErrors) {
      errors.push({ url: '/admin/tareas', type: 'js-error', message: e, ts: new Date().toISOString() });
    }
    expect(jsErrors, `Broken buttons produced JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);
    await page.close();
  });

  // ── Admin dashboard stats ───────────────────────────────────────────────────

  test('admin dashboard — stat cards are visible', async () => {
    const page = await context.newPage();
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Stat cards should exist
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });

    await page.close();
  });
});
