import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin";
}

function startOfDay(dateStr: string) {
  return new Date(dateStr + "T00:00:00.000Z");
}

// GET /api/instrucciones?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dateParam = req.nextUrl.searchParams.get("date");
  if (!dateParam) return NextResponse.json({ error: "date required" }, { status: 400 });

  const day = startOfDay(dateParam);
  const notes = await prisma.dailyNote.findMany({
    where: { date: day },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return NextResponse.json(notes);
}

// POST /api/instrucciones — upsert (one note per employee per day)
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.userId || !body.date) {
    return NextResponse.json({ error: "userId and date required" }, { status: 400 });
  }

  const day = startOfDay(body.date);
  const note = await prisma.dailyNote.upsert({
    where: { userId_date: { userId: String(body.userId), date: day } },
    create: {
      userId: String(body.userId),
      date: day,
      content: String(body.content ?? ""),
    },
    update: { content: String(body.content ?? "") },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return NextResponse.json(note);
}
