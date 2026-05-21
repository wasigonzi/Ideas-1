import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin";
}

const FIELDS = ["dayOfWeek", "start", "end", "label", "active", "userId"] as const;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of FIELDS) {
    if (k in body) {
      let v = body[k];
      if (k === "dayOfWeek") v = Number(v);
      if (k === "active") v = Boolean(v);
      data[k] = v;
    }
  }
  const shift = await prisma.shift.update({ where: { id }, data });
  return NextResponse.json(shift);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
