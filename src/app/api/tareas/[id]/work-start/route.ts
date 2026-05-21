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

  // Verify the task exists and is assigned to this user (or user is admin)
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // If already has an active session on this exact task, return it (idempotent)
  const existing = await prisma.workSession.findFirst({
    where: { taskId, userId, endedAt: null },
  });
  if (existing) {
    return NextResponse.json({ session: existing });
  }

  // End any other active sessions this user has on other tasks
  await prisma.workSession.updateMany({
    where: { userId, endedAt: null },
    data: { endedAt: new Date() },
  });

  // Create new session
  const ws = await prisma.workSession.create({
    data: { taskId, userId },
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
