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
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (role !== "admin") {
    let members: string[] = [];
    try { members = task.members ? JSON.parse(task.members) : []; } catch { /* ignore */ }
    const isAssignee = task.assigneeId === userId;
    const isMember = members.includes(userId);
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

  // End any other active sessions and create the new one atomically to prevent race conditions
  const ws = await prisma.$transaction(async (tx) => {
    await tx.workSession.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: new Date() },
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
