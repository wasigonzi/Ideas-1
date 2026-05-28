import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function getUser() {
  const session = await auth();
  return session?.user as { role?: string; id?: string } | undefined;
}

const invoiceInclude = {
  client: { select: { id: true, name: true, email: true, phone: true, company: true } },
};

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (user.role === "admin") {
    const invoices = await prisma.invoice.findMany({
      include: invoiceInclude,
      orderBy: { issuedAt: "desc" },
    });
    return NextResponse.json(invoices);
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.clientName || !body.amount || !body.dueDate) {
    return NextResponse.json({ error: "clientName, amount, dueDate requeridos" }, { status: 400 });
  }

  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  // Use max(count, last sequence) so deletions don't cause duplicate numbers
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: `INV-${year}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last ? parseInt(last.number.split("-")[2] ?? "0", 10) : 0;
  const seq = Math.max(count, lastSeq) + 1;
  const number = `INV-${year}-${String(seq).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      clientName:    body.clientName    ?? null,
      clientEmail:   body.clientEmail   ?? null,
      clientCompany: body.clientCompany ?? null,
      clientPhone:   body.clientPhone   ?? null,
      amount:  Number(body.amount),
      paid:    Number(body.paid ?? 0),
      status:  body.status ?? "pending",
      dueDate: new Date(body.dueDate),
      notes:   body.notes ?? null,
    },
    include: invoiceInclude,
  });

  return NextResponse.json(invoice, { status: 201 });
}
