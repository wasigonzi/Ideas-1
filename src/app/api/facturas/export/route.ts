import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";

// Escapa un valor para CSV (comillas dobles + envoltura si hay coma/comilla/salto).
function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}/${y}`; // formato MM/DD/YYYY que QuickBooks importa
};

// GET → exporta facturas en CSV compatible con la importación de QuickBooks Online.
// Filtros opcionales: ?status=pending|paid|overdue|cancelled y ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: {
    status?: string;
    issuedAt?: { gte?: Date; lte?: Date };
  } = {};
  if (status && status !== "all") where.status = status;
  if (from || to) {
    where.issuedAt = {};
    if (from) where.issuedAt.gte = new Date(from);
    if (to) where.issuedAt.lte = new Date(`${to}T23:59:59`);
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: { select: { name: true, email: true, company: true } } },
    orderBy: { issuedAt: "asc" },
  });

  // Columnas estándar de importación de facturas de QuickBooks Online.
  const headers = [
    "InvoiceNo",
    "Customer",
    "InvoiceDate",
    "DueDate",
    "Item(Product/Service)",
    "ItemAmount",
    "Email",
    "Status",
    "Balance",
  ];

  const rows = invoices.map((inv) => {
    const customer =
      inv.clientCompany || inv.client?.company || inv.clientName || inv.client?.name || "Cliente";
    const email = inv.clientEmail || inv.client?.email || "";
    const balance = inv.amount - inv.paid;
    return [
      csvCell(inv.number),
      csvCell(customer),
      csvCell(fmtDate(inv.issuedAt)),
      csvCell(fmtDate(inv.dueDate)),
      csvCell(inv.notes || "Servicios de impresión y rotulación"),
      csvCell(inv.amount.toFixed(2)),
      csvCell(email),
      csvCell(inv.status),
      csvCell(balance.toFixed(2)),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  await logAudit({
    actor: auth,
    action: "export",
    entity: "Invoice",
    summary: `Exportó ${invoices.length} factura(s) a CSV de QuickBooks`,
    metadata: { status: status ?? "all", from, to, count: invoices.length },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="facturas-quickbooks-${stamp}.csv"`,
    },
  });
}
