import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const taskSelect = {
  id: true,
  title: true,
  order: { select: { id: true, number: true } },
} as const;

const userSelect = {
  id: true,
  name: true,
  email: true,
  hourlyRate: true,
} as const;

// PUT /api/horas/[id] — update a time entry (admin only)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { userId, taskId, hours, note, date } = body;

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      ...(userId ? { userId } : {}),
      taskId: taskId || null,
      hours: Number(hours),
      note: note || null,
      ...(date ? { date: new Date(date) } : {}),
    },
    include: {
      user: { select: userSelect },
      task: { select: taskSelect },
    },
  });

  return NextResponse.json(entry);
}

// DELETE /api/horas/[id] — delete a time entry (admin only)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
