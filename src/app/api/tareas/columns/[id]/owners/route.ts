import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function findColumn(id: string) {
  return (
    (await prisma.taskColumn.findUnique({ where: { id } })) ??
    (await prisma.taskColumn.findUnique({ where: { key: id } }))
  );
}

// GET /api/tareas/columns/[id]/owners — list default owners for a column
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const column = await findColumn(id);
  if (!column) return NextResponse.json({ error: "not found" }, { status: 404 });

  const owners = await prisma.columnOwner.findMany({
    where: { columnId: column.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } }
  });
  return NextResponse.json(owners.map((o) => o.user));
}

// PUT /api/tareas/columns/[id]/owners — replace the owner set for a column
// Body: { userIds: string[] }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const column = await findColumn(id);
  if (!column) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const userIds: string[] = Array.isArray(body.userIds)
    ? Array.from(new Set<string>(body.userIds.filter((x: unknown): x is string => typeof x === "string")))
    : [];

  await prisma.$transaction([
    prisma.columnOwner.deleteMany({ where: { columnId: column.id } }),
    ...(userIds.length
      ? [prisma.columnOwner.createMany({ data: userIds.map((userId) => ({ columnId: column.id, userId })) })]
      : [])
  ]);

  const owners = await prisma.columnOwner.findMany({
    where: { columnId: column.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } }
  });
  return NextResponse.json(owners.map((o) => o.user));
}
