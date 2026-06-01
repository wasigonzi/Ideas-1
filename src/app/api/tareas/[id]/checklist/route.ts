import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/tareas/[id]/checklist — list items
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const items = await prisma.taskChecklistItem.findMany({
    where: { taskId: id },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(items);
}

// POST /api/tareas/[id]/checklist — create item
// Body: { text: string }
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 500) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const last = await prisma.taskChecklistItem.findFirst({
    where: { taskId: id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const item = await prisma.taskChecklistItem.create({
    data: { taskId: id, text, position: (last?.position ?? 0) + 10 },
  });
  return NextResponse.json(item, { status: 201 });
}
