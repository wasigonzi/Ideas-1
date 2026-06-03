import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { safeStringArray } from "@/lib/workflow";

type Ctx = { params: Promise<{ id: string }> };

type SheetRow = {
  id: string;
  taskId: string;
  data: string;
  status: string;
  clientNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// GET /api/tareas/[id]/hoja — anyone with access to the task can read
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // Verify task exists and the user has access
  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      assigneeId: true,
      members: true,
      taskMembers: { select: { userId: true } },
    },
  });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  let members = safeStringArray(task.members);
  try { members = task.members ? JSON.parse(task.members) : []; } catch { /* corrupt JSON — treat as empty */ }
  const hasAccess =
    user.role === "admin" ||
    user.role === "employee" ||
    task.assigneeId === user.id ||
    members.includes(user.id ?? "") ||
    task.taskMembers.some((member) => member.userId === user.id);

  if (!hasAccess) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await prisma.$queryRaw<SheetRow[]>`
    SELECT * FROM "ApprovalSheet" WHERE "taskId" = ${id} LIMIT 1
  `;
  const sheet = rows[0] ?? null;
  if (!sheet) return NextResponse.json(null);

  let parsedData: unknown;
  try { parsedData = JSON.parse(sheet.data); } catch { parsedData = null; }
  return NextResponse.json({ ...sheet, data: parsedData });
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
  const newId = randomUUID();
  const now = new Date();

  const rows = await prisma.$queryRaw<SheetRow[]>`
    INSERT INTO "ApprovalSheet" (id, "taskId", data, status, "clientNote", "createdAt", "updatedAt")
    VALUES (${newId}, ${id}, ${dataStr}, 'pending', NULL, ${now}, ${now})
    ON CONFLICT ("taskId") DO UPDATE
      SET data = ${dataStr}, status = 'pending', "clientNote" = NULL, "updatedAt" = ${now}
    RETURNING *
  `;
  const sheet = rows[0];

  // Move task to "Para revisión" so the client knows it's waiting for their approval.
  await prisma.task.update({ where: { id }, data: { status: "review" } });

  let parsedDataPost: unknown;
  try { parsedDataPost = JSON.parse(sheet.data); } catch { parsedDataPost = null; }
  return NextResponse.json({ ...sheet, data: parsedDataPost });
}
