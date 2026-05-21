import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-PR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function quoteNumber(id: string, createdAt: Date): string {
  return `COT-${createdAt.getFullYear()}-${id.slice(-6).toUpperCase()}`;
}

function validUntil(createdAt: Date): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 30);
  return fmtDate(d);
}

function parseAmount(budget: string | null | undefined): number | null {
  if (!budget) return null;
  const n = parseFloat(budget.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_LABELS: Record<string, string> = {
  new: "NUEVA", reviewed: "REVISADA", quoted: "COTIZACIÓN", won: "APROBADA", lost: "RECHAZADA",
};
const STATUS_COLORS: Record<string, string> = {
  new: "#6b7280", reviewed: "#3b82f6", quoted: "#f59e0b", won: "#10b981", lost: "#ef4444",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q) return new NextResponse("Not found", { status: 404 });

  const number = quoteNumber(q.id, q.createdAt);
  const amount = parseAmount(q.budget);
  const statusColor = STATUS_COLORS[q.status] ?? "#6b7280";
  const statusLabel = STATUS_LABELS[q.status] ?? q.status.toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cotización ${esc(number)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:14px;line-height:1.6}
    .header{display:flex;justify-content:space-between;align-items:center;background:#111827;padding:28px 48px}
    .brand img{height:64px;width:auto;display:block}
    .brand p{color:#9ca3af;font-size:12px;margin-top:4px}
    .inv-info{text-align:right}
    .inv-info h2{font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px}
    .inv-info .num{font-size:14px;color:#9ca3af;margin-top:2px}
    .badge{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.05em;background:${statusColor}30;color:${statusColor};border:1px solid ${statusColor}60}
    .body{padding:36px 48px 48px}
    hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0}
    .meta{display:flex;justify-content:space-between;gap:24px;margin-bottom:32px}
    .bill h3{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px}
    .bill .name{font-size:16px;font-weight:700;color:#111827}
    .bill p{color:#4b5563;font-size:13px;margin-top:3px}
    .dates-table{border-collapse:collapse}
    .dates-table td{padding:3px 0 3px 16px;font-size:13px;color:#111827}
    .dates-table td:first-child{padding-left:0;font-weight:600;color:#374151;min-width:100px}
    .section-title{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px}
    .scope{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:28px;white-space:pre-wrap;font-size:13px;color:#374151;line-height:1.7}
    .items{width:100%;border-collapse:collapse;margin-bottom:24px}
    .items thead tr{background:#111827;color:#fff}
    .items thead th{padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;text-align:left}
    .items thead th:last-child{text-align:right}
    .items tbody tr{border-bottom:1px solid #e5e7eb}
    .items tbody td{padding:14px 16px;color:#374151;vertical-align:top}
    .items tbody td:last-child{text-align:right;font-weight:700;color:#111827;white-space:nowrap}
    .totals{margin-left:auto;width:260px;margin-bottom:32px}
    .trow{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f3f4f6}
    .trow.total{border-bottom:none;padding-top:10px}
    .trow .lbl{font-weight:600;color:#111827;font-size:15px}
    .trow .val{font-weight:900;font-size:18px;color:#111827}
    .terms{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:32px}
    .terms h4{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#166534;margin-bottom:8px}
    .terms ul{list-style:none;padding:0}
    .terms li{color:#15803d;font-size:13px;padding:2px 0}
    .terms li::before{content:"✓  "}
    .footer{text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:20px}
    @media print{body{background:#fff!important}}
  </style>
</head>
<body>

<div class="header">
  <div class="brand">
    <img src="https://static.showit.co/1200/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png" alt="Ideas, LLC">
    <p>Impresión &amp; Rotulación · Puerto Rico</p>
  </div>
  <div class="inv-info">
    <h2>COTIZACIÓN</h2>
    <div class="num">${esc(number)}</div>
    <div class="badge">${statusLabel}</div>
  </div>
</div>

<div class="body">

  <div class="meta">
    <div class="bill">
      <h3>Preparada para</h3>
      <div class="name">${esc(q.company ?? q.name)}</div>
      ${q.company ? `<p>${esc(q.name)}</p>` : ""}
      <p>${esc(q.email)}</p>
      ${q.phone ? `<p>${esc(q.phone)}</p>` : ""}
    </div>
    <div>
      <table class="dates-table">
        <tr><td>Fecha</td><td>${fmtDate(q.createdAt)}</td></tr>
        ${q.deadline ? `<tr><td>Entrega</td><td>${esc(q.deadline)}</td></tr>` : ""}
        <tr><td>Válida hasta</td><td>${validUntil(q.createdAt)}</td></tr>
      </table>
    </div>
  </div>

  <hr>

  ${q.service ? `<div style="margin-bottom:20px"><span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af">Servicio: </span><span style="font-weight:600;color:#111827">${esc(q.service)}</span></div>` : ""}

  <div class="section-title">Alcance del trabajo</div>
  <div class="scope">${esc(q.message)}</div>

  <table class="items">
    <thead>
      <tr><th style="width:100%">Descripción</th><th>Total</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${esc(q.service ?? "Servicios de impresión y rotulación")}</td>
        <td>${amount !== null ? `$${fmt(amount)}` : esc(q.budget ?? "Por cotizar")}</td>
      </tr>
    </tbody>
  </table>

  ${amount !== null ? `
  <div class="totals">
    <div class="trow total">
      <span class="lbl">Total</span>
      <span class="val">$${fmt(amount)}</span>
    </div>
  </div>` : ""}

  <div class="terms">
    <h4>Términos y condiciones</h4>
    <ul>
      <li>50% de pago por adelantado para iniciar el trabajo</li>
      <li>50% restante al entregar el trabajo terminado</li>
      <li>Esta cotización es válida por 30 días a partir de la fecha de emisión</li>
      <li>Cambios en el alcance del trabajo pueden afectar el precio final</li>
    </ul>
  </div>

  <div class="footer">
    Gracias por considerar a <strong>IDEAS, LLC</strong> · ideas@printingideaspr.com · printingideaspr.com<br>
    <span style="font-size:11px;color:#d1d5db">Generado el ${fmtDate(new Date())}</span>
  </div>

</div>
<script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
