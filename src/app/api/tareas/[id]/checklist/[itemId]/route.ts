import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH /api/tareas/[id]/checklist/[itemId] — toggle done or update text
// DELETE /api/tareas/[id]/checklist/[itemId] — remove item

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { itemId } = await ctx.params;
  const body = await req.json().catch(() => ({})) as { done?: unknown; text?: unknown };
  const data: Record<string, unknown> = {};
  if (typeof body.done === "boolean") data.done = body.done;
  if (typeof body.text === "string") {
    const t = body.text.trim();
    if (!t) return NextResponse.json({ error: "text required" }, { status: 400 });
    if (t.length > 500) return NextResponse.json({ error: "too_long" }, { status: 400 });
    data.text = t;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const item = await prisma.taskChecklistItem.update({ where: { id: itemId }, data });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { itemId } = await ctx.params;
  await prisma.taskChecklistItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
