import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hoursBetween, localDateKey } from "@/lib/time";

async function getUserId() {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!u?.id) return null;
  if (!["employee", "admin"].includes(u.role ?? "")) return null;
  return u.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const open = await prisma.punch.findFirst({
    where: { userId, out: null },
    orderBy: { in: "desc" },
    include: { breaks: { where: { end: null }, take: 1, orderBy: { start: "desc" } } }
  });

  const openBreak = open?.breaks?.[0] ?? null;

  // Today (local)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayPunches = await prisma.punch.findMany({
    where: { userId, in: { gte: startOfDay } },
    orderBy: { in: "asc" }
  });
  const todayHours = todayPunches.reduce((sum, p) => {
    if (p.hours != null) return sum + p.hours;
    if (!p.out) return sum + hoursBetween(p.in, now);
    return sum;
  }, 0);

  // This week (Sun..Sat)
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  sunday.setHours(0, 0, 0, 0);
  const weekPunches = await prisma.punch.findMany({
    where: { userId, in: { gte: sunday } }
  });
  const weekHours = weekPunches.reduce((sum, p) => {
    if (p.hours != null) return sum + p.hours;
    if (!p.out) return sum + hoursBetween(p.in, now);
    return sum;
  }, 0);

  // Fetch active tasks assigned to the user or where the user is a member
  const tasks = await prisma.task.findMany({
    where: {
      archived: false,
      OR: [
        { assigneeId: userId },
        { members: { contains: userId } },
        { taskMembers: { some: { userId } } },
      ],
    },
    include: {
      workSessions: {
        where: { userId, endedAt: null },
        select: { id: true, startedAt: true },
      }
    },
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }]
  });

  const taskList = tasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    hours: t.hours,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    activeSession: t.workSessions[0]
      ? { id: t.workSessions[0].id, startedAt: t.workSessions[0].startedAt.toISOString() }
      : null
  }));

  // Fetch today's time entries logged on tasks
  const todayTimeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      date: { gte: startOfDay }
    },
    include: {
      task: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const todayTaskHours = todayTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const loggedTasks = todayTimeEntries.map(e => ({
    id: e.id,
    hours: e.hours,
    note: e.note,
    taskTitle: e.task?.title ?? "Sin tarea"
  }));

  return NextResponse.json({
    open: open ? { id: open.id, in: open.in, note: open.note } : null,
    openBreak: openBreak ? { id: openBreak.id, start: openBreak.start } : null,
    today: { date: localDateKey(now), hours: todayHours, count: todayPunches.length },
    week: { hours: weekHours },
    tasks: taskList,
    todayTimeEntries: loggedTasks,
    todayTaskHours: Math.round(todayTaskHours * 100) / 100
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as { note?: string; action?: string }));
  const note = typeof body.note === "string" ? body.note.trim() || null : null;
  const action = typeof body.action === "string" ? body.action : "toggle";

  const open = await prisma.punch.findFirst({
    where: { userId, out: null },
    orderBy: { in: "desc" }
  });

  // --- BREAK START ---
  if (action === "break_start") {
    if (!open) return NextResponse.json({ error: "not clocked in" }, { status: 400 });
    const existing = await prisma.punchBreak.findFirst({ where: { punchId: open.id, end: null } });
    if (existing) return NextResponse.json({ error: "break already active" }, { status: 400 });
    const brk = await prisma.punchBreak.create({ data: { punchId: open.id } });
    return NextResponse.json({ action: "break_start", break: brk });
  }

  // --- BREAK END ---
  if (action === "break_end") {
    if (!open) return NextResponse.json({ error: "not clocked in" }, { status: 400 });
    const existing = await prisma.punchBreak.findFirst({ where: { punchId: open.id, end: null } });
    if (!existing) return NextResponse.json({ error: "no active break" }, { status: 400 });
    const brk = await prisma.punchBreak.update({ where: { id: existing.id }, data: { end: new Date() } });
    return NextResponse.json({ action: "break_end", break: brk });
  }

  // --- CLOCK OUT ---
  if (open) {
    const now = new Date();

    // Close any open break automatically
    const openBreak = await prisma.punchBreak.findFirst({ where: { punchId: open.id, end: null } });
    if (openBreak) {
      await prisma.punchBreak.update({ where: { id: openBreak.id }, data: { end: now } });
    }

    // Compute net hours (total - breaks)
    const allBreaks = await prisma.punchBreak.findMany({ where: { punchId: open.id } });
    const breakHours = allBreaks.reduce((sum, b) => sum + hoursBetween(b.start, b.end ?? now), 0);
    const hours = Math.max(0, Math.round((hoursBetween(open.in, now) - breakHours) * 100) / 100);

    const updated = await prisma.punch.update({
      where: { id: open.id },
      data: { out: now, hours, note: note ?? open.note }
    });
    return NextResponse.json({ action: "out", punch: updated });
  }

  // --- CLOCK IN ---
  const created = await prisma.punch.create({ data: { userId, note } });
  return NextResponse.json({ action: "in", punch: created }, { status: 201 });
}
