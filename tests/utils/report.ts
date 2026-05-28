/**
 * tests/utils/report.ts
 * Shared utilities for accumulating errors, saving JSON reports,
 * and generating an HTML evidence file that can be printed to PDF.
 */
import * as fs   from 'fs';
import * as path from 'path';

export const REPORT_DIR  = path.join(__dirname, '..', 'report');
export const SHOT_DIR    = path.join(REPORT_DIR, 'screenshots');
export const AUTH_DIR    = path.join(__dirname, '..', '.auth');
export const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
export const EMP_STATE   = path.join(AUTH_DIR, 'empleado.json');
export const CLI_STATE   = path.join(AUTH_DIR, 'cliente.json');

// ── Types ────────────────────────────────────────────────────────────────────

export interface PageError {
  url:     string;
  type:    'js-error' | 'network-error' | 'broken-page' | 'api-error' | 'broken-link' | 'perf';
  message: string;
  ts:      string;
}

export interface CrawledPage {
  url:        string;
  status:     number;
  title:      string;
  screenshot: string;
  errors:     string[];
  loadMs:     number;
}

export interface ApiCall {
  url:      string;
  method:   string;
  status:   number;
  ok:       boolean;
  bodySnip: string;
}

export interface PerfResult {
  url:        string;
  ttfb:       number;
  domContent: number;
  loadMs:     number;
  jsHeap:     number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function ensureDirs() {
  [REPORT_DIR, SHOT_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

export function saveJSON(filename: string, data: unknown) {
  ensureDirs();
  const out = path.join(REPORT_DIR, filename);
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf-8');
  return out;
}

/** Reads the sitemap JSON written by the crawler, or returns empty array. */
export function readSitemap(): CrawledPage[] {
  const f = path.join(REPORT_DIR, 'sitemap.json');
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as CrawledPage[];
}

/** Generates a self-contained HTML report from the JSON files. */
export function generateHTMLReport() {
  ensureDirs();

  const sitemap  = jsonOrEmpty<CrawledPage[]>('sitemap.json');
  const errors   = jsonOrEmpty<PageError[]>('errors.json');
  const perf     = jsonOrEmpty<PerfResult[]>('performance.json');
  const apiCalls = jsonOrEmpty<ApiCall[]>('api-calls.json');

  const errorCount = errors.length;
  const brokenPages = sitemap.filter((p) => p.status >= 400);

  const rows = (arr: unknown[], cols: string[], row: (item: never) => string) =>
    arr.length === 0
      ? '<tr><td colspan="' + cols.length + '" style="text-align:center;color:#aaa">Sin datos</td></tr>'
      : arr.map(row).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Playwright QA Report — ${new Date().toLocaleDateString('es-PR')}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font:14px/1.5 system-ui,sans-serif;background:#0f1117;color:#e5e7eb;padding:2rem}
    h1{font-size:1.6rem;color:#fff;margin-bottom:.25rem}
    .sub{color:#6b7280;margin-bottom:2rem;font-size:.85rem}
    h2{font-size:1.1rem;color:#f59e0b;margin:2rem 0 .75rem;border-bottom:1px solid #374151;padding-bottom:.4rem}
    table{width:100%;border-collapse:collapse;font-size:.8rem}
    th{background:#1f2937;color:#9ca3af;text-align:left;padding:.5rem .75rem;text-transform:uppercase;font-size:.7rem;letter-spacing:.05em}
    td{border-top:1px solid #1f2937;padding:.5rem .75rem;vertical-align:top}
    tr:hover td{background:#1f2937}
    .ok{color:#34d399}.err{color:#f87171}.warn{color:#fbbf24}
    .badge{display:inline-block;padding:.1rem .5rem;border-radius:9999px;font-size:.7rem;font-weight:700}
    .badge-ok{background:#065f46;color:#34d399}.badge-err{background:#7f1d1d;color:#f87171}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem}
    .stat{background:#1f2937;border-radius:.75rem;padding:1.25rem;text-align:center}
    .stat-val{font-size:2rem;font-weight:800;color:#f59e0b}
    .stat-lbl{font-size:.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-top:.25rem}
    .screenshots{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .screenshots img{width:180px;height:110px;object-fit:cover;border-radius:.5rem;border:1px solid #374151}
    @media print{body{background:#fff;color:#000}th{background:#e5e7eb;color:#374151}td{border-color:#e5e7eb}}
  </style>
</head>
<body>
<h1>🧪 Playwright QA Report</h1>
<p class="sub">Generado: ${new Date().toLocaleString('es-PR')} · Framework: Next.js · Herramienta: Playwright</p>

<div class="stats">
  <div class="stat"><div class="stat-val">${sitemap.length}</div><div class="stat-lbl">Páginas rastreadas</div></div>
  <div class="stat"><div class="stat-val ${errorCount > 0 ? 'err' : 'ok'}">${errorCount}</div><div class="stat-lbl">Errores JS</div></div>
  <div class="stat"><div class="stat-val ${brokenPages.length > 0 ? 'err' : 'ok'}">${brokenPages.length}</div><div class="stat-lbl">Páginas rotas</div></div>
  <div class="stat"><div class="stat-val">${apiCalls.filter((a) => !a.ok).length}</div><div class="stat-lbl">API fallidas</div></div>
</div>

<h2>📋 Sitemap — páginas rastreadas</h2>
<table>
  <thead><tr><th>URL</th><th>Status</th><th>Título</th><th>Carga (ms)</th><th>Errores</th></tr></thead>
  <tbody>
    ${rows(sitemap, ['URL','Status','Título','ms','Errors'], (p: CrawledPage) => `
      <tr>
        <td>${p.url}</td>
        <td><span class="badge ${p.status < 400 ? 'badge-ok' : 'badge-err'}">${p.status}</span></td>
        <td>${p.title || '—'}</td>
        <td>${p.loadMs}</td>
        <td class="${p.errors.length > 0 ? 'err' : 'ok'}">${p.errors.length > 0 ? p.errors.join('<br>') : '✓'}</td>
      </tr>`)}
  </tbody>
</table>

<h2>🚨 Errores detectados</h2>
<table>
  <thead><tr><th>URL</th><th>Tipo</th><th>Mensaje</th><th>Timestamp</th></tr></thead>
  <tbody>
    ${rows(errors, ['URL','Tipo','Mensaje','Timestamp'], (e: PageError) => `
      <tr>
        <td>${e.url}</td>
        <td class="warn">${e.type}</td>
        <td class="err">${e.message.substring(0, 200)}</td>
        <td style="color:#6b7280;white-space:nowrap">${e.ts}</td>
      </tr>`)}
  </tbody>
</table>

<h2>⚡ Performance</h2>
<table>
  <thead><tr><th>URL</th><th>TTFB (ms)</th><th>DOMContentLoaded (ms)</th><th>Load (ms)</th><th>JS Heap (MB)</th></tr></thead>
  <tbody>
    ${rows(perf, ['URL','TTFB','DCL','Load','Heap'], (p: PerfResult) => `
      <tr>
        <td>${p.url}</td>
        <td class="${p.ttfb > 500 ? 'warn' : 'ok'}">${p.ttfb}</td>
        <td class="${p.domContent > 2000 ? 'warn' : 'ok'}">${p.domContent}</td>
        <td class="${p.loadMs > 3000 ? 'err' : p.loadMs > 1500 ? 'warn' : 'ok'}">${p.loadMs}</td>
        <td>${(p.jsHeap / 1024 / 1024).toFixed(1)}</td>
      </tr>`)}
  </tbody>
</table>

<h2>🔌 API calls monitoreadas</h2>
<table>
  <thead><tr><th>URL</th><th>Método</th><th>Status</th><th>OK</th><th>Respuesta</th></tr></thead>
  <tbody>
    ${rows(apiCalls, ['URL','Método','Status','OK','Resp'], (a: ApiCall) => `
      <tr>
        <td>${a.url}</td>
        <td>${a.method}</td>
        <td><span class="badge ${a.ok ? 'badge-ok' : 'badge-err'}">${a.status}</span></td>
        <td class="${a.ok ? 'ok' : 'err'}">${a.ok ? '✓' : '✗'}</td>
        <td style="font-size:.7rem;color:#6b7280">${a.bodySnip}</td>
      </tr>`)}
  </tbody>
</table>

</body>
</html>`;

  const out = path.join(REPORT_DIR, 'report.html');
  fs.writeFileSync(out, html, 'utf-8');
  return out;
}

function jsonOrEmpty<T>(filename: string): T extends unknown[] ? T : never[] {
  const f = path.join(REPORT_DIR, filename);
  if (!fs.existsSync(f)) return [] as never[];
  try { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
  catch { return [] as never[]; }
}
