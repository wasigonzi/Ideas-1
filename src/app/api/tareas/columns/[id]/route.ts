import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ensureColumnsMaterialized, isValidAccent } from "@/lib/task-columns";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureColumnsMaterialized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: { label?: string; accent?: string | null } = {};
  if (typeof body.label === "string") {
    const v = body.label.trim();
    if (!v) return NextResponse.json({ error: "label required" }, { status: 400 });
    if (v.length > 60)
      return NextResponse.json({ error: "label too long" }, { status: 400 });
    data.label = v;
  }
  if (body.accent === null) data.accent = null;
  else if (isValidAccent(body.accent)) data.accent = body.accent;

  // Look up by key first (defaults are seeded with deterministic keys, while
  // the client passes whatever id it has — we accept either id or key).
  const existing =
    (await prisma.taskColumn.findUnique({ where: { id } })) ??
    (await prisma.taskColumn.findUnique({ where: { key: id } }));
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.taskColumn.update({
    where: { id: existing.id },
    data
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureColumnsMaterialized();
  const { id } = await params;

  const existing =
    (await prisma.taskColumn.findUnique({ where: { id } })) ??
    (await prisma.taskColumn.findUnique({ where: { key: id } }));
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Refuse to delete the last remaining column — board needs at least one.
  const total = await prisma.taskColumn.count({ where: { archived: false } });
  if (total <= 1)
    return NextResponse.json(
      { error: "Debe quedar al menos una lista." },
      { status: 400 }
    );

  // Move any tasks in the deleted column to the first remaining column.
  const fallback = await prisma.taskColumn.findFirst({
    where: { archived: false, NOT: { id: existing.id } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { key: true }
  });
  if (fallback) {
    await prisma.task.updateMany({
      where: { status: existing.key },
      data: { status: fallback.key }
    });
  }

  await prisma.taskColumn.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
