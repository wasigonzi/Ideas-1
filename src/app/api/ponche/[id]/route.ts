import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hoursBetween } from "@/lib/time";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin";
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("in" in body && body.in) data.in = new Date(body.in);
  if ("out" in body) data.out = body.out ? new Date(body.out) : null;
  if ("note" in body) data.note = body.note?.toString() || null;
  if ("source" in body) data.source = String(body.source || "manual");

  // Recompute hours when both ends are present (after merge)
  const current = await prisma.punch.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const inAt = (data.in as Date | undefined) ?? current.in;
  const outAt = "out" in data ? (data.out as Date | null) : current.out;
  if (outAt) {
    if (outAt <= inAt) {
      return NextResponse.json({ error: "La salida debe ser posterior a la entrada" }, { status: 400 });
    }
    data.hours = Math.round(hoursBetween(inAt, outAt) * 100) / 100;
  } else {
    data.hours = null;
  }

  const updated = await prisma.punch.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.punch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
