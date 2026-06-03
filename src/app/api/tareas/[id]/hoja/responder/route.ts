import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { safeStringArray } from "@/lib/workflow";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/tareas/[id]/hoja/responder — client responds: approve or request changes
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "client") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      assigneeId: true,
      members: true,
      taskMembers: { select: { userId: true } },
    },
  });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const legacyMembers = safeStringArray(task.members);
  const hasAccess =
    task.assigneeId === user.id ||
    legacyMembers.includes(user.id) ||
    task.taskMembers.some((member) => member.userId === user.id);

  if (!hasAccess) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const status: string = body.status; // "approved" | "changes_requested"
  const clientNote: string | null = body.clientNote ?? null;

  if (!["approved", "changes_requested"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const now = new Date();
  type SheetRow = { id: string; taskId: string; data: string; status: string; clientNote: string | null; createdAt: Date; updatedAt: Date };

  const rows = await prisma.$queryRaw<SheetRow[]>`
    UPDATE "ApprovalSheet"
    SET status = ${status}, "clientNote" = ${clientNote}, "updatedAt" = ${now}
    WHERE "taskId" = ${id}
    RETURNING *
  `;

  if (!rows[0]) return NextResponse.json({ error: "sheet not found" }, { status: 404 });
  const sheet = rows[0];

  // Automatically transition the task column based on the client's decision.
  const nextTaskStatus = status === "approved" ? "produccion" : "in_progress";
  await prisma.task.update({ where: { id }, data: { status: nextTaskStatus } });

  return NextResponse.json({ ...sheet, data: JSON.parse(sheet.data) });
}
