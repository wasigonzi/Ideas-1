/**
 * tests/visual.spec.ts
 *
 * Visual regression testing:
 *  • Takes full-page screenshots of key pages
 *  • On FIRST run: creates baseline snapshots in tests/snapshots/
 *  • On SUBSEQUENT runs: compares against baseline, fails if diff exceeds threshold
 *  • Tests both Desktop and Mobile (separate snapshot sets)
 *  • Screenshots saved to tests/report/screenshots/visual/
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test visual.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import { ADMIN_STATE, SHOT_DIR, ensureDirs } from './utils/report';

const VISUAL_SHOT = path.join(SHOT_DIR, 'visual');
const MAX_DIFF_PIXELS = 200; // allow minor pixel differences (antialiasing, etc.)

const PUBLIC_PAGES = [
  { name: 'home',        route: '/' },
  { name: 'nosotros',    route: '/nosotros' },
  { name: 'servicios',   route: '/servicios' },
  { name: 'proyectos',   route: '/proyectos' },
  { name: 'cotizacion',  route: '/cotizacion' },
  { name: 'login',       route: '/login' },
];

const PORTAL_PAGES = [
  { name: 'admin-dashboard', route: '/admin' },
  { name: 'admin-tareas',    route: '/admin/tareas' },
  { name: 'admin-proyectos', route: '/admin/proyectos' },
  { name: 'empleado-home',   route: '/empleado' },
  { name: 'empleado-ponche', route: '/empleado/ponche' },
];

test.beforeAll(() => {
  ensureDirs();
  if (!fs.existsSync(VISUAL_SHOT)) fs.mkdirSync(VISUAL_SHOT, { recursive: true });
});

// ── Public pages — no auth needed ─────────────────────────────────────────────

test.describe('Visual: Public Pages', () => {
  for (const { name, route } of PUBLIC_PAGES) {
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });

      // Hide animated/dynamic elements to stabilise snapshots
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0ms !important;
            transition-duration: 0ms !important;
          }
        `,
      });

      // Wait for images to load
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);

      // Visual regression comparison
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixels: MAX_DIFF_PIXELS,
      });

      // Also save a named copy for the report
      await page.screenshot({
        path: path.join(VISUAL_SHOT, `${name}.png`),
        fullPage: true,
      });
    });
  }
});

// ── Portal pages — admin auth ─────────────────────────────────────────────────

test.describe('Visual: Portal Pages', () => {
  test.use({
    storageState: fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined,
  });

  for (const { name, route } of PORTAL_PAGES) {
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      expect(page.url()).not.toContain('/login');

      await page.addStyleTag({
        content: `*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }`,
      });

      // Mask dynamic content (dates, user counts) to avoid false diffs
      await page.addStyleTag({
        content: `.tabular-nums, time { opacity: 0 !important; }`,
      });

      await page.waitForTimeout(600);

      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixels: MAX_DIFF_PIXELS,
        mask: [
          // Mask clock / timestamp areas if present
          page.locator('.tabular-nums'),
          page.locator('time'),
        ],
      });

      await page.screenshot({
        path: path.join(VISUAL_SHOT, `${name}.png`),
        fullPage: true,
      });
    });
  }
});

// ── Responsive spot-check (viewport: 390px) ───────────────────────────────────

test.describe('Visual: Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  for (const { name, route } of PUBLIC_PAGES.slice(0, 3)) {
    test(`mobile screenshot: ${name}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.addStyleTag({
        content: `*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }`,
      });
      await page.waitForTimeout(400);

      await expect(page).toHaveScreenshot(`mobile-${name}.png`, {
        fullPage: true,
        maxDiffPixels: MAX_DIFF_PIXELS,
      });

      await page.screenshot({
        path: path.join(VISUAL_SHOT, `mobile-${name}.png`),
        fullPage: true,
      });
    });
  }
});
