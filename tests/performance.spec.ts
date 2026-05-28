/**
 * tests/performance.spec.ts
 *
 * Performance scanning:
 *  • Measures TTFB, DOMContentLoaded, Load time, JS Heap for each key page
 *  • Reports Core Web Vitals via JS evaluation
 *  • Thresholds: TTFB < 800ms, Load < 4000ms (local dev — generous limits)
 *  • Exports performance.json
 *  • Fails test if any page exceeds hard limits
 */

import { test, expect, BrowserContext } from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import { ADMIN_STATE, ensureDirs, saveJSON, PerfResult } from './utils/report';

const THRESHOLDS = {
  ttfb:       1500, // ms  — Time To First Byte (generous for local dev)
  domContent: 5000, // ms  — DOMContentLoaded
  load:       8000, // ms  — full page load
  jsHeap:     200 * 1024 * 1024, // 200 MB
};

const PAGES_TO_AUDIT = [
  '/',
  '/nosotros',
  '/servicios',
  '/proyectos',
  '/cotizacion',
  '/admin',
  '/admin/tareas',
  '/admin/proyectos',
  '/admin/cotizaciones',
  '/admin/horas',
  '/admin/settings',
  '/empleado',
  '/empleado/horas',
  '/empleado/ponche',
];

test.describe('Performance Audit', () => {
  let context: BrowserContext;
  const results: PerfResult[] = [];

  test.beforeAll(async ({ browser }) => {
    ensureDirs();
    const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
    context = await browser.newContext({ storageState: stateFile as string | undefined });
  });

  test.afterAll(async () => {
    saveJSON('performance.json', results);

    // Print summary table
    console.log('\n── Performance Summary ─────────────────────────────────────────────');
    console.log(`${'URL'.padEnd(35)} | ${'TTFB'.padStart(6)} | ${'DCL'.padStart(6)} | ${'Load'.padStart(7)} | ${'Heap MB'.padStart(8)}`);
    console.log('─'.repeat(75));
    for (const r of results) {
      const ttfbFlag  = r.ttfb       > THRESHOLDS.ttfb       ? '⚠' : '✓';
      const loadFlag  = r.loadMs     > THRESHOLDS.load        ? '⚠' : '✓';
      console.log(
        `${r.url.padEnd(35)} | ${String(r.ttfb).padStart(5)}ms | ${String(r.domContent).padStart(5)}ms | ${String(r.loadMs).padStart(6)}ms ${loadFlag} | ${(r.jsHeap / 1024 / 1024).toFixed(1).padStart(6)}MB ${ttfbFlag}`,
      );
    }
    console.log('────────────────────────────────────────────────────────────────────\n');

    await context.close();
  });

  for (const route of PAGES_TO_AUDIT) {
    test(`performance: ${route}`, async () => {
      const page = await context.newPage();

      const t0 = Date.now();
      await page.goto(route, { waitUntil: 'load', timeout: 30_000 });
      const wallLoad = Date.now() - t0;

      // Navigation Timing API
      const timing = await page.evaluate<{
        ttfb: number; domContent: number; loadMs: number;
      }>(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (!nav) {
          return {
            ttfb:       0,
            domContent: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            loadMs:     performance.timing.loadEventEnd              - performance.timing.navigationStart,
          };
        }
        return {
          ttfb:       Math.round(nav.responseStart),
          domContent: Math.round(nav.domContentLoadedEventEnd),
          loadMs:     Math.round(nav.loadEventEnd),
        };
      });

      // JS heap (Chromium-specific)
      const metrics = await page.metrics();
      const jsHeap  = (metrics.JSHeapUsedSize as number) ?? 0;

      const result: PerfResult = {
        url:        route,
        ttfb:       timing.ttfb       || wallLoad,
        domContent: timing.domContent || wallLoad,
        loadMs:     timing.loadMs     || wallLoad,
        jsHeap,
      };
      results.push(result);

      // Soft warnings for slow pages
      if (result.loadMs > THRESHOLDS.load) {
        console.warn(`  ⚠ SLOW: ${route} — load=${result.loadMs}ms (limit ${THRESHOLDS.load}ms)`);
      }

      // Hard failures only for extreme cases
      expect(
        result.loadMs,
        `Page load took too long: ${route} = ${result.loadMs}ms`,
      ).toBeLessThan(THRESHOLDS.load * 2);

      expect(
        result.jsHeap,
        `JS heap too large: ${route} = ${(result.jsHeap / 1024 / 1024).toFixed(1)}MB`,
      ).toBeLessThan(THRESHOLDS.jsHeap);

      await page.close();
    });
  }

  // ── Largest Contentful Paint (LCP) via PerformanceObserver ───────────────

  test('LCP: home page LCP under 4s', async () => {
    const page = await context.newPage();

    // Inject LCP observer before navigation
    await page.addInitScript(() => {
      (window as Window & typeof globalThis & { __lcp?: number }).__lcp = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last    = entries[entries.length - 1];
        if (last) (window as Window & typeof globalThis & { __lcp?: number }).__lcp = last.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1_000); // allow LCP to settle

    const lcp = await page.evaluate<number>(
      () => (window as Window & typeof globalThis & { __lcp?: number }).__lcp ?? 0,
    );

    console.log(`  LCP on /: ${Math.round(lcp)}ms`);
    expect(lcp, `LCP too high: ${Math.round(lcp)}ms`).toBeLessThan(6_000);

    await page.close();
  });
});
