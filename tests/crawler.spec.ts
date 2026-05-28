/**
 * tests/crawler.spec.ts
 *
 * Full-site crawler that:
 *  • Visits every internal page (public + authenticated portal)
 *  • Detects JS/console errors on each page
 *  • Detects broken pages (HTTP 4xx/5xx)
 *  • Saves screenshots automatically
 *  • Discovers links automatically (no hardcoded list needed)
 *  • Avoids infinite loops (visited set + MAX_PAGES cap)
 *  • Exports sitemap.json + errors.json + HTML report
 *  • Generates a visual HTML site map gallery
 */

import { test, expect, Page, BrowserContext }  from '@playwright/test';
import * as fs   from 'fs';
import * as path from 'path';
import {
  ADMIN_STATE, SHOT_DIR, REPORT_DIR,
  CrawledPage, PageError,
  ensureDirs, saveJSON, generateHTMLReport,
} from './utils/report';

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_PAGES  = 150;
const TIMEOUT_MS = 20_000;

/** Known routes to seed the queue (crawler also discovers more from links). */
const SEED_ROUTES = [
  '/',
  '/nosotros',
  '/servicios',
  '/proyectos',
  '/cotizacion',
  '/login',
  '/admin',
  '/admin/tareas',
  '/admin/proyectos',
  '/admin/usuarios',
  '/admin/cotizaciones',
  '/admin/facturas',
  '/admin/horarios',
  '/admin/horas',
  '/admin/instrucciones',
  '/admin/chat',
  '/admin/ordenes',
  '/admin/servicios',
  '/admin/settings',
  '/admin/landing',
  '/admin/paginas',
  '/empleado',
  '/empleado/tareas',
  '/empleado/horas',
  '/empleado/ponche',
  '/empleado/chat',
  '/empleado/horario',
  '/cliente',
  '/cliente/tareas',
  '/cliente/ordenes',
  '/cliente/facturas',
  '/cliente/mensajes',
  '/cliente/perfil',
];

// ── Shared state ──────────────────────────────────────────────────────────────

const visited: Set<string>  = new Set();
const queue:   string[]     = [...SEED_ROUTES];
const crawled: CrawledPage[] = [];
const allErrors: PageError[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseURL(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
    if (u.origin !== new URL(base).origin) return null; // external
    if (u.pathname.startsWith('/_next'))               return null; // Next internals
    if (u.pathname.match(/\.[a-z]{2,5}$/i))            return null; // static files
    // Strip hash and query string for dedup
    return u.pathname;
  } catch { return null; }
}

function shotPath(url: string): string {
  const safe = url.replace(/[^a-z0-9-_]/gi, '_').replace(/_{2,}/g, '_').slice(0, 80);
  return path.join(SHOT_DIR, `${safe || 'root'}.png`);
}

async function visitPage(
  context: BrowserContext,
  url:     string,
  baseURL: string,
): Promise<{ page: CrawledPage; links: string[] }> {
  const page = await context.newPage();
  const errors: string[] = [];
  const links:  string[] = [];

  // Collect JS errors
  page.on('pageerror',      (e) => errors.push(`[js] ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });

  const t0 = Date.now();
  let status = 0;
  let title  = '';

  try {
    const resp = await page.goto(baseURL + url, {
      waitUntil: 'domcontentloaded',
      timeout:   TIMEOUT_MS,
    });
    status = resp?.status() ?? 0;
    title  = await page.title().catch(() => '');

    // Collect all internal hrefs
    const hrefs = await page.$$eval('a[href]', (els) =>
      els.map((el) => (el as HTMLAnchorElement).href),
    );
    for (const h of hrefs) {
      const norm = normaliseURL(h, baseURL + url);
      if (norm && !visited.has(norm)) links.push(norm);
    }

    // Screenshot
    ensureDirs();
    const shot = shotPath(url);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  } catch (err: unknown) {
    status = -1;
    errors.push(`[load] ${(err as Error).message ?? err}`);
  }

  const loadMs = Date.now() - t0;
  const record: CrawledPage = { url, status, title, screenshot: shotPath(url), errors, loadMs };
  await page.close();
  return { page: record, links };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Site Crawler', () => {
  let context: BrowserContext;
  let baseURL:  string;

  test.beforeAll(async ({ browser, baseURL: bURL }) => {
    baseURL = bURL ?? 'http://127.0.0.1:3010';
    // Use admin auth so portal pages are accessible
    const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
    context = await browser.newContext({
      storageState: stateFile as string | undefined,
    });
    ensureDirs();
  });

  test.afterAll(async () => {
    await context.close();
    // Persist results
    saveJSON('sitemap.json', crawled);
    saveJSON('errors.json',  allErrors);

    // Generate visual HTML report
    const htmlPath = generateHTMLReport();

    // Generate gallery HTML
    generateGallery(crawled);

    console.log(`\n──────────────────────────────────────────`);
    console.log(`Crawler finished. Pages visited: ${crawled.length}`);
    console.log(`Errors found:  ${allErrors.length}`);
    console.log(`Report: ${htmlPath}`);
    console.log(`──────────────────────────────────────────\n`);
  });

  test('crawl all pages — detect JS errors, broken pages, screenshots', async () => {
    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      console.log(`  ⬡ [${visited.size}/${MAX_PAGES}] ${url}`);
      const { page: record, links } = await visitPage(context, url, baseURL);
      crawled.push(record);

      // Accumulate errors
      for (const msg of record.errors) {
        allErrors.push({
          url,
          type:    msg.startsWith('[js]') ? 'js-error' : 'broken-page',
          message: msg,
          ts:      new Date().toISOString(),
        });
      }

      // Broken page check
      if (record.status >= 400) {
        allErrors.push({
          url,
          type:    'broken-page',
          message: `HTTP ${record.status}`,
          ts:      new Date().toISOString(),
        });
      }

      // Enqueue discovered links
      for (const link of links) {
        if (!visited.has(link)) queue.push(link);
      }
    }

    // Assert: no broken pages (4xx/5xx)
    const broken = crawled.filter((p) => p.status >= 400 && p.status !== 401 && p.status !== 403);
    if (broken.length > 0) {
      console.error('Broken pages detected:');
      broken.forEach((p) => console.error(`  ${p.status} → ${p.url}`));
    }
    // Soft assertion: warn but don't fail test for 401/403 (auth-only pages)
    expect(broken, `Broken pages: ${broken.map((p) => p.url).join(', ')}`).toHaveLength(0);
  });

  test('all visited pages have no JS errors', async () => {
    const jsErrors = allErrors.filter((e) => e.type === 'js-error');
    if (jsErrors.length > 0) {
      console.warn(`JS errors found on ${jsErrors.length} occurrence(s):`);
      jsErrors.forEach((e) => console.warn(`  ${e.url}: ${e.message.slice(0, 120)}`));
    }
    expect(jsErrors, jsErrors.map((e) => `${e.url}: ${e.message}`).join('\n')).toHaveLength(0);
  });

  test('sitemap has expected public pages', async () => {
    const publicRoutes = ['/', '/nosotros', '/servicios', '/proyectos', '/cotizacion'];
    for (const route of publicRoutes) {
      const found = crawled.find((p) => p.url === route);
      expect(found, `Expected page to exist: ${route}`).toBeDefined();
      if (found) expect(found.status).toBeLessThan(400);
    }
  });
});

// ── Gallery generator ─────────────────────────────────────────────────────────

function generateGallery(pages: CrawledPage[]) {
  const rows = pages.map((p) => {
    const relShot = path.relative(REPORT_DIR, p.screenshot).replace(/\\/g, '/');
    const statusColor = p.status >= 400 ? '#f87171' : '#34d399';
    return `
      <div style="background:#1f2937;border-radius:.75rem;overflow:hidden;border:1px solid #374151">
        <div style="position:relative">
          <img src="${relShot}" alt="${p.url}" style="width:100%;height:140px;object-fit:cover;object-position:top"
               onerror="this.style.display='none'" />
          <span style="position:absolute;top:.4rem;right:.4rem;background:${statusColor};
                       color:#000;font-size:.65rem;font-weight:700;padding:.15rem .5rem;border-radius:9999px">
            ${p.status}
          </span>
        </div>
        <div style="padding:.6rem .75rem">
          <div style="font-size:.7rem;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
               title="${p.url}">${p.url}</div>
          <div style="font-size:.65rem;color:#6b7280;margin-top:.2rem">${p.loadMs}ms
            ${p.errors.length > 0 ? `<span style="color:#f87171;margin-left:.4rem">⚠ ${p.errors.length} err</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Visual Sitemap</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font:14px system-ui,sans-serif;background:#0f1117;color:#e5e7eb;padding:2rem}
h1{font-size:1.4rem;color:#fff;margin-bottom:1.5rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
</style></head><body>
<h1>🗺 Visual Sitemap — ${pages.length} páginas</h1>
<div class="grid">${rows}</div>
</body></html>`;

  fs.writeFileSync(path.join(REPORT_DIR, 'sitemap-gallery.html'), html, 'utf-8');
}
