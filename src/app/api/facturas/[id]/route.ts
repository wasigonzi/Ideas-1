import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

const invoiceInclude = {
  client: { select: { id: true, name: true, email: true, phone: true, company: true } },
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("clientName"    in body) data.clientName    = body.clientName;
  if ("clientEmail"   in body) data.clientEmail   = body.clientEmail;
  if ("clientCompany" in body) data.clientCompany = body.clientCompany;
  if ("clientPhone"   in body) data.clientPhone   = body.clientPhone;
  if ("status" in body) data.status = body.status;
  if ("paid"   in body) data.paid   = Number(body.paid);
  if ("amount" in body) data.amount = Number(body.amount);
  if ("dueDate" in body) data.dueDate = new Date(body.dueDate);
  if ("notes"  in body) data.notes  = body.notes;
  // Always set paidAt when status changes to paid
  if (body.status === "paid") data.paidAt = new Date();

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
    include: invoiceInclude,
  });
  await logAudit({
    actor: { role: "admin" },
    action: "update",
    entity: "Invoice",
    entityId: id,
    summary: `Editó la factura ${invoice.number}`,
    metadata: data,
  });
  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.invoice.findUnique({ where: { id }, select: { number: true, amount: true } });
  await prisma.invoice.delete({ where: { id } });
  await logAudit({
    actor: { role: "admin" },
    action: "delete",
    entity: "Invoice",
    entityId: id,
    summary: existing ? `Borró la factura ${existing.number} ($${existing.amount.toFixed(2)})` : `Borró la factura ${id}`,
  });
  return NextResponse.json({ ok: true });
}
