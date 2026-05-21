import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin";
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: punchId } = await ctx.params;

  const punch = await prisma.punch.findUnique({ where: { id: punchId } });
  if (!punch) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json();
  if (!body.start) return NextResponse.json({ error: "start required" }, { status: 400 });

  const start = new Date(body.start);
  const end = body.end ? new Date(body.end) : null;

  const brk = await prisma.punchBreak.create({
    data: { punchId, start, end }
  });

  return NextResponse.json(brk, { status: 201 });
}
