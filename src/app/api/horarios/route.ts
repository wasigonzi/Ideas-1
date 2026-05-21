import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const shifts = await prisma.shift.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ userId: "asc" }, { dayOfWeek: "asc" }, { start: "asc" }]
  });
  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.userId || body.dayOfWeek == null || !body.start || !body.end) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const shift = await prisma.shift.create({
    data: {
      userId: String(body.userId),
      dayOfWeek: Number(body.dayOfWeek),
      start: String(body.start),
      end: String(body.end),
      label: body.label ? String(body.label) : null,
      active: body.active === false ? false : true
    }
  });
  return NextResponse.json(shift, { status: 201 });
}
