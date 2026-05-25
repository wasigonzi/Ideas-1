import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tareas/[id]/hoja — anyone with access to the task can read
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // Verify task exists and the user has access
  const task = await prisma.task.findUnique({ where: { id }, select: { id: true, assigneeId: true, members: true } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const members: string[] = task.members ? JSON.parse(task.members) : [];
  const hasAccess =
    user.role === "admin" ||
    user.role === "employee" ||
    task.assigneeId === user.id ||
    members.includes(user.id);

  if (!hasAccess) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheet = await (prisma as any).approvalSheet.findUnique({ where: { taskId: id } });
  if (!sheet) return NextResponse.json(null);

  return NextResponse.json({
    ...sheet,
    data: JSON.parse(sheet.data),
  });
}

// POST /api/tareas/[id]/hoja — admin/employee only: save or update
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || !["admin", "employee"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({ where: { id }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const dataStr = JSON.stringify(body.data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheet = await (prisma as any).approvalSheet.upsert({
    where: { taskId: id },
    create: { taskId: id, data: dataStr, status: "pending" },
    update: { data: dataStr, status: "pending", clientNote: null },
  });

  return NextResponse.json({ ...sheet, data: JSON.parse(sheet.data) });
}
