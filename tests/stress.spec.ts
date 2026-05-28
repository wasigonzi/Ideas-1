/**
 * tests/stress.spec.ts
 *
 * Stress / load testing:
 *  • Fires N concurrent requests to key pages using multiple browser contexts
 *  • Measures p50 / p95 / p99 response times
 *  • Checks for errors under concurrent load
 *  • Tests rapid sequential navigation (no memory leaks / crashes)
 *  • Exports stress-results.json
 */

import { test, expect } from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import { ADMIN_STATE, ensureDirs, saveJSON } from './utils/report';

interface StressResult {
  url:         string;
  concurrency: number;
  p50:         number;
  p95:         number;
  p99:         number;
  errors:      number;
  avgMs:       number;
}

const STRESS_TARGETS = [
  { url: '/',             concurrency: 8 },
  { url: '/servicios',    concurrency: 8 },
  { url: '/admin',        concurrency: 5 },
  { url: '/admin/tareas', concurrency: 5 },
];

const RAPID_SEQUENCE = [
  '/',
  '/nosotros',
  '/servicios',
  '/proyectos',
  '/admin',
  '/admin/tareas',
  '/admin/proyectos',
  '/empleado',
  '/empleado/horas',
];

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx    = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

test.describe('Stress Testing', () => {
  const allResults: StressResult[] = [];

  test.afterAll(() => {
    saveJSON('stress-results.json', allResults);

    console.log('\n── Stress Test Summary ─────────────────────────────────────────────');
    console.log(`${'URL'.padEnd(30)} | ${'N'.padStart(3)} | ${'p50'.padStart(6)} | ${'p95'.padStart(6)} | ${'p99'.padStart(6)} | ${'Errors'.padStart(6)}`);
    console.log('─'.repeat(70));
    for (const r of allResults) {
      console.log(
        `${r.url.padEnd(30)} | ${String(r.concurrency).padStart(3)} | ${String(r.p50).padStart(5)}ms | ${String(r.p95).padStart(5)}ms | ${String(r.p99).padStart(5)}ms | ${String(r.errors).padStart(6)}`,
      );
    }
    console.log('────────────────────────────────────────────────────────────────────\n');
  });

  for (const target of STRESS_TARGETS) {
    test(`concurrent load: ${target.url} × ${target.concurrency}`, async ({ browser }) => {
      ensureDirs();
      const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
      const { url, concurrency } = target;

      // Create N contexts (simulates N independent users)
      const contexts = await Promise.all(
        Array.from({ length: concurrency }, () =>
          browser.newContext({ storageState: stateFile as string | undefined }),
        ),
      );

      const start = Date.now();

      const runs = await Promise.all(
        contexts.map(async (ctx) => {
          const page     = await ctx.newPage();
          const jsErrors: string[] = [];
          page.on('pageerror', (e) => jsErrors.push(e.message));

          const t0   = Date.now();
          let status = 0;
          try {
            const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
            status = resp?.status() ?? 0;
          } catch (err) {
            jsErrors.push(String(err));
            status = -1;
          }

          const elapsed = Date.now() - t0;
          await page.close();
          return { elapsed, status, errors: jsErrors.length };
        }),
      );

      await Promise.all(contexts.map((c) => c.close()));

      const times   = runs.map((r) => r.elapsed);
      const errors  = runs.reduce((s, r) => s + r.errors, 0);
      const broken  = runs.filter((r) => r.status >= 500 || r.status === -1);

      const result: StressResult = {
        url,
        concurrency,
        p50:    percentile(times, 50),
        p95:    percentile(times, 95),
        p99:    percentile(times, 99),
        errors,
        avgMs:  Math.round(times.reduce((s, t) => s + t, 0) / times.length),
      };
      allResults.push(result);

      console.log(`  ${url} × ${concurrency} → p50=${result.p50}ms p95=${result.p95}ms errors=${errors}`);

      // No server errors under concurrent load
      expect(
        broken,
        `${broken.length} requests failed under load: ${url}`,
      ).toHaveLength(0);

      // p95 under 10 seconds (generous for local dev server)
      expect(
        result.p95,
        `p95 too high under load: ${url} = ${result.p95}ms`,
      ).toBeLessThan(10_000);
    });
  }

  // ── Rapid sequential navigation (single user, many pages) ────────────────

  test('rapid sequential navigation — no memory leaks or crashes', async ({ browser }) => {
    const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
    const context   = await browser.newContext({ storageState: stateFile as string | undefined });
    const page      = await context.newPage();
    const errors: string[] = [];

    page.on('pageerror', (e) => errors.push(e.message));

    const times: number[] = [];

    for (const route of RAPID_SEQUENCE) {
      const t0 = Date.now();
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        times.push(Date.now() - t0);
      } catch (err) {
        errors.push(`${route}: ${err}`);
        times.push(Date.now() - t0);
      }
    }

    const metrics = await page.metrics();
    const heap    = ((metrics.JSHeapUsedSize as number) ?? 0) / 1024 / 1024;

    console.log(`  Rapid nav: ${RAPID_SEQUENCE.length} pages, avg=${Math.round(times.reduce((s, t) => s + t, 0) / times.length)}ms, heap=${heap.toFixed(1)}MB`);

    await context.close();

    expect(errors, `Errors during rapid navigation:\n${errors.join('\n')}`).toHaveLength(0);
    // Heap should not blow up after visiting many pages
    expect(heap, `JS heap too large after navigation: ${heap.toFixed(1)}MB`).toBeLessThan(500);
  });

  // ── Repeated API calls (simulates poll-heavy use) ─────────────────────────

  test('repeated API polling — no degradation', async ({ browser }) => {
    const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
    const context   = await browser.newContext({ storageState: stateFile as string | undefined });
    const page      = await context.newPage();

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    const apiEndpoints = ['/api/tareas', '/api/proyectos', '/api/site-config'];
    const times: number[] = [];

    for (let round = 0; round < 5; round++) {
      for (const ep of apiEndpoints) {
        const t0   = Date.now();
        const resp = await page.request.get(ep).catch(() => null);
        times.push(Date.now() - t0);
        if (resp) {
          expect(resp.status(), `${ep} returned error`).toBeLessThan(500);
        }
      }
    }

    const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
    console.log(`  API poll avg response: ${avg}ms over ${times.length} calls`);
    expect(avg, `API responses too slow: ${avg}ms`).toBeLessThan(3_000);

    await context.close();
  });
});
