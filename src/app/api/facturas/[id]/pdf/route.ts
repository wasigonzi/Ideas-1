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

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDIENTE",
  paid: "PAGADO",
  overdue: "VENCIDA",
  cancelled: "CANCELADA",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#6b7280",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role?: string; id?: string } | undefined;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true, phone: true, company: true } },
    },
  });

  if (!inv) return new NextResponse("Not found", { status: 404 });
  if (user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Resolve client info — prefer direct fields, fallback to linked user
  const cName    = inv.clientName    ?? inv.client?.name    ?? "";
  const cEmail   = inv.clientEmail   ?? inv.client?.email   ?? "";
  const cCompany = inv.clientCompany ?? inv.client?.company ?? "";
  const cPhone   = inv.clientPhone   ?? inv.client?.phone   ?? "";

  const balance = Math.max(0, inv.amount - inv.paid);
  const statusColor = STATUS_COLORS[inv.status] ?? "#6b7280";
  const statusLabel = STATUS_LABELS[inv.status] ?? inv.status.toUpperCase();
  const lineDesc = inv.notes ? null : "Servicios de impresión y rotulación, Ideas LLC";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Factura ${esc(inv.number)} — Ideas, LLC</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:14px;line-height:1.55}
    .page{max-width:760px;margin:0 auto;padding:0 0 40px}
    .header{display:flex;justify-content:space-between;align-items:center;background:#111827;padding:28px 48px;margin-bottom:36px;border-radius:0}
    .brand img{height:64px;width:auto;display:block}
    .brand p{color:#9ca3af;font-size:12px;margin-top:4px}
    .inv-info{text-align:right}
    .inv-info h2{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1px}
    .inv-info .num{font-size:14px;color:#9ca3af;margin-top:2px}
    .badge{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.05em;background:${statusColor}1a;color:${statusColor};border:1px solid ${statusColor}40}
    hr{border:none;border-top:1px solid #e5e7eb;margin:24px 48px}
    .meta{display:flex;justify-content:space-between;gap:24px;margin-bottom:36px;padding:0 48px}
    .bill h3{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px}
    .bill .name{font-size:16px;font-weight:700;color:#111827}
    .bill p{color:#4b5563;font-size:13px;margin-top:2px}
    .dates-table{border-collapse:collapse;margin-left:auto}
    .dates-table td{padding:3px 0 3px 16px;font-size:13px;color:#111827}
    .dates-table td:first-child{padding-left:0;font-weight:600;color:#374151;min-width:80px}
    .order-ref{background:#f3f4f6;border-radius:8px;padding:10px 14px;font-size:13px;color:#4b5563;margin:0 48px 24px}
    .order-ref strong{color:#111827}
    .items{width:calc(100% - 96px);border-collapse:collapse;margin:0 48px 24px}
    .items thead tr{background:#111827;color:#fff}
    .items thead th{padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;text-align:left}
    .items thead th:last-child{text-align:right}
    .items tbody tr{border-bottom:1px solid #e5e7eb}
    .items tbody td{padding:14px 16px;color:#374151;vertical-align:top}
    .items tbody td:last-child{text-align:right;font-weight:600;color:#111827;white-space:nowrap}
    .totals{margin-left:auto;margin-right:48px;width:280px;margin-bottom:32px}
    .trow{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6}
    .trow .lbl{color:#6b7280}.trow .val{font-weight:600;color:#111827}
    .trow.paid .val{color:#10b981}
    .trow.balance{border-bottom:none;padding-top:10px}
    .trow.balance .lbl{font-weight:700;font-size:15px;color:#111827}
    .trow.balance .val{font-weight:900;font-size:18px;color:#111827}
    .trow.balance.zero .val{color:#10b981}
    .notes{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:0 48px 32px}
    .notes h4{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#92400e;margin-bottom:6px}
    .notes p{color:#78350f;font-size:13px;white-space:pre-wrap}
    .footer{text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding:20px 48px 0;margin:0 48px}
    @media print{body{background:#fff!important}.no-print{display:none!important}}
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="brand">
      <img src="https://static.showit.co/1200/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png" alt="Ideas, LLC">
      <p>Impresión &amp; Rotulación · Puerto Rico</p>
    </div>
    <div class="inv-info">
      <h2>FACTURA</h2>
      <div class="num">${esc(inv.number)}</div>
      <div class="badge">${statusLabel}</div>
    </div>
  </div>

  <hr>

  <div class="meta">
    <div class="bill">
      <h3>Facturar a</h3>
      <div class="name">${esc(cCompany || cName)}</div>
      ${cCompany && cName ? `<p>${esc(cName)}</p>` : ""}
      ${cEmail ? `<p>${esc(cEmail)}</p>` : ""}
      ${cPhone ? `<p>${esc(cPhone)}</p>` : ""}
    </div>
    <div>
      <table class="dates-table">
        <tr><td>Emitida</td><td>${fmtDate(inv.issuedAt)}</td></tr>
        <tr><td>Vence</td><td>${fmtDate(inv.dueDate)}</td></tr>
        ${inv.paidAt ? `<tr><td>Pagada</td><td style="color:#10b981">${fmtDate(inv.paidAt)}</td></tr>` : ""}
      </table>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr><th style="width:100%">Descripción</th><th>Monto</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${esc(lineDesc ?? inv.notes ?? "")}</td>
        <td>$${fmt(inv.amount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="trow"><span class="lbl">Subtotal</span><span class="val">$${fmt(inv.amount)}</span></div>
    ${inv.paid > 0 ? `<div class="trow paid"><span class="lbl">Pagado</span><span class="val">− $${fmt(inv.paid)}</span></div>` : ""}
    <div class="trow balance${balance === 0 ? " zero" : ""}">
      <span class="lbl">Balance</span><span class="val">$${fmt(balance)}</span>
    </div>
  </div>

  ${inv.notes && inv.order ? `<div class="notes"><h4>Notas</h4><p>${esc(inv.notes)}</p></div>` : ""}

  <div class="footer">
    Gracias por su preferencia · <strong>IDEAS, LLC</strong> · ideas@printingideaspr.com<br>
    <span style="font-size:11px;color:#d1d5db">Generado el ${new Date().toLocaleDateString("es-PR", { year: "numeric", month: "long", day: "numeric" })}</span>
  </div>

</div>
<script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
