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

// GET /api/horas?days=N — list time entries for the last N days (admin only)
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days") ?? 30), 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: since } },
    include: {
      user: { select: userSelect },
      task: { select: taskSelect },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

// POST /api/horas — create a time entry (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, taskId, hours, note, date } = body;
  if (!userId || !hours) {
    return NextResponse.json({ error: "userId y hours son requeridos" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      taskId: taskId || null,
      hours: Number(hours),
      note: note || null,
      date: date ? new Date(date) : new Date(),
    },
    include: {
      user: { select: userSelect },
      task: { select: taskSelect },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
