import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/tareas/[id]/hoja/responder — client responds: approve or request changes
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // Verify task access for client
  const task = await prisma.task.findUnique({ where: { id }, select: { assigneeId: true, members: true } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const members: string[] = task.members ? JSON.parse(task.members) : [];
  const hasAccess =
    user.role === "admin" ||
    user.role === "employee" ||
    task.assigneeId === user.id ||
    members.includes(user.id);

  if (!hasAccess) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const status: string = body.status; // "approved" | "changes_requested"
  const clientNote: string | null = body.clientNote ?? null;

  if (!["approved", "changes_requested"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheet = await (prisma as any).approvalSheet.update({
    where: { taskId: id },
    data: { status, clientNote },
  });

  return NextResponse.json({ ...sheet, data: JSON.parse(sheet.data) });
}
