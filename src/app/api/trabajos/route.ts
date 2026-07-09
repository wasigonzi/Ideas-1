import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function startOfDay(dateStr: string) {
  return new Date(dateStr + "T00:00:00.000Z");
}

// GET /api/trabajos?date=YYYY-MM-DD[&userId=...]
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  const loggedInUserId = (session.user as { id?: string }).id;

  if (!loggedInUserId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const day = startOfDay(dateParam);
  let userId = req.nextUrl.searchParams.get("userId");

  // If user is employee, force them to only query their own report
  if (role !== "admin") {
    userId = loggedInUserId;
  }

  if (userId) {
    // Return single report for specified user
    const report = await prisma.workReport.findUnique({
      where: { userId_date: { userId, date: day } },
    });
    return NextResponse.json(report || null);
  } else {
    // Admin request for all reports of that date
    const reports = await prisma.workReport.findMany({
      where: { date: day },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return NextResponse.json(reports);
  }
}

// POST /api/trabajos
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  const loggedInUserId = (session.user as { id?: string }).id;

  if (!loggedInUserId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const day = startOfDay(body.date);
  let targetUserId = body.userId;

  // If not admin, you can only update your own report
  if (role !== "admin" || !targetUserId) {
    targetUserId = loggedInUserId;
  }

  const report = await prisma.workReport.upsert({
    where: { userId_date: { userId: targetUserId, date: day } },
    create: {
      userId: targetUserId,
      date: day,
      content: String(body.content ?? ""),
    },
    update: { content: String(body.content ?? "") },
  });

  return NextResponse.json(report);
}
