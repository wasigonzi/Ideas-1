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

// GET /api/horas?from=YYYY-MM-DD&to=YYYY-MM-DD — entries in date range (admin only)
// Fallback: ?days=N for last N days
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  let since: Date;
  let until: Date | undefined;

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (fromParam) {
    since = new Date(fromParam + "T00:00:00");
    until = toParam ? new Date(toParam + "T23:59:59") : undefined;
  } else {
    const days = Math.min(Math.max(Number(searchParams.get("days") ?? 30), 1), 365);
    since = new Date();
    since.setDate(since.getDate() - days);
  }

  const [entries, punches] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        date: {
          gte: since,
          ...(until ? { lte: until } : {}),
        },
      },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
      orderBy: { date: "desc" },
    }),
    prisma.punch.findMany({
      where: {
        in: {
          gte: since,
          ...(until ? { lte: until } : {}),
        },
      },
      select: {
        userId: true,
        hours: true,
      },
    }),
  ]);

  const punchHoursMap: Record<string, number> = {};
  for (const p of punches) {
    if (p.hours) {
      punchHoursMap[p.userId] = (punchHoursMap[p.userId] || 0) + p.hours;
    }
  }

  return NextResponse.json({ entries, punchHours: punchHoursMap });
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
