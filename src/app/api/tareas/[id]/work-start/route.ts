import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/tareas/[id]/work-start
// Starts a work session for the current employee on this task.
// If the employee has an active session on another task, that one is ended first.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user as { id: string; role: string };
  if (!["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id: taskId } = await params;

  // Verify the task exists and the user has permission (admin, assignee, or member)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { taskMembers: { select: { userId: true } } },
  });
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (role !== "admin") {
    let legacyMembers: string[] = [];
    try { legacyMembers = task.members ? JSON.parse(task.members) : []; } catch { /* ignore */ }
    const isAssignee = task.assigneeId === userId;
    const isMember = legacyMembers.includes(userId) || task.taskMembers.some((m) => m.userId === userId);
    if (!isAssignee && !isMember) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  // If already has an active session on this exact task, return it (idempotent)
  const existing = await prisma.workSession.findFirst({
    where: { taskId, userId, endedAt: null },
  });
  if (existing) {
    return NextResponse.json({ session: existing });
  }

  const now = new Date();
  // Close any orphaned sessions (started more than 8 hours ago and never ended).
  const staleThreshold = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  await prisma.workSession.updateMany({
    where: { userId, endedAt: null, startedAt: { lt: staleThreshold } },
    data: { endedAt: staleThreshold },
  });

  // End any other active sessions and create the new one atomically to prevent race conditions
  const ws = await prisma.$transaction(async (tx) => {
    await tx.workSession.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: now },
    });
    return tx.workSession.create({
      data: { taskId, userId },
    });
  });

  // Move task to in_progress if it was todo
  if (task.status === "todo") {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "in_progress" },
    });
  }

  return NextResponse.json({ session: ws });
}
