import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/tareas/[id]/work-stop
// Body: { submitForReview?: boolean }
// Ends the active work session and optionally moves the task to "review".
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user as { id: string; role: string };
  if (!["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id: taskId } = await params;
  const body = await req.json().catch(() => ({}));
  const submitForReview: boolean = body?.submitForReview === true;

  const now = new Date();

  // Find the active session
  const ws = await prisma.workSession.findFirst({
    where: { taskId, userId, endedAt: null },
  });
  if (!ws) {
    return NextResponse.json({ error: "no_active_session" }, { status: 404 });
  }

  // End the session
  const ended = await prisma.workSession.update({
    where: { id: ws.id },
    data: { endedAt: now },
  });

  const elapsedMs = now.getTime() - ws.startedAt.getTime();
  const elapsedSeconds = Math.round(elapsedMs / 1000);
  const elapsedHours = elapsedMs / 3600000;

  // Create a TimeEntry so hours show up in the existing horas page
  if (elapsedHours >= 0.01) {
    await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        hours: Math.round(elapsedHours * 100) / 100,
        date: ws.startedAt,
        note: `Sesión de trabajo ${ws.startedAt.toLocaleDateString("es-PR")}`,
      },
    });
  }

  // Optionally change task status to "review"
  let updatedStatus: string | undefined;
  if (submitForReview) {
    // Regla de oro: no se puede enviar a revisión sin una hoja de aprobación
    // creada para que el cliente la pueda revisar.
    const approval = await prisma.approvalSheet.findUnique({
      where: { taskId },
      select: { id: true },
    });
    if (!approval) {
      return NextResponse.json(
        {
          error: "approval_sheet_required",
          message:
            "No puedes enviar a revisión sin crear la hoja de aprobación para el cliente.",
        },
        { status: 400 }
      );
    }
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: "review" },
      select: { status: true },
    });
    updatedStatus = task.status;
  }

  return NextResponse.json({
    session: ended,
    elapsedSeconds,
    newStatus: updatedStatus ?? null,
  });
}
