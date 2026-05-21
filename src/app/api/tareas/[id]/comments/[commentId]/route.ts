import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH /api/tareas/[id]/comments/[commentId]  { body: string }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const role   = (session?.user as { role?: string } | undefined)?.role;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { commentId } = await ctx.params;
  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Only the author (or admin) may edit.
  if (comment.authorId !== userId && role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const body = typeof json?.body === "string" ? json.body.trim() : "";
  if (!body) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (body.length > 5000) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const updated = await prisma.taskComment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() }
  });
  return NextResponse.json({ comment: updated });
}

// DELETE /api/tareas/[id]/comments/[commentId]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const role   = (session?.user as { role?: string } | undefined)?.role;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { commentId } = await ctx.params;
  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (comment.authorId !== userId && role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.taskComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
