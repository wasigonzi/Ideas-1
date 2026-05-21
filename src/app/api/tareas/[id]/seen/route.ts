import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/tareas/[id]/seen
// Records that the current user has viewed the task's comments feed.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // Ensure task exists.
  const task = await prisma.task.findUnique({ where: { id }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, avatar: true }
  });

  await prisma.taskView.upsert({
    where: { taskId_userId: { taskId: id, userId } },
    create: { taskId: id, userId, name: user?.name ?? null, avatar: user?.avatar ?? null },
    update: { name: user?.name ?? null, avatar: user?.avatar ?? null }
  });

  return NextResponse.json({ ok: true });
}

// GET /api/tareas/[id]/seen
// Returns who has viewed this task.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const views = await prisma.taskView.findMany({
    where: { taskId: id },
    orderBy: { seenAt: "desc" }
  });

  return NextResponse.json({
    viewers: views.map((v) => ({
      userId: v.userId,
      name: v.name,
      avatar: v.avatar,
      seenAt: v.seenAt
    }))
  });
}
