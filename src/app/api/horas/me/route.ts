import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/horas/me?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns the calling employee's time entries for the given date range.
export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const where: Record<string, unknown> = { userId };
  if (fromParam) {
    where.date = {
      gte: new Date(fromParam + "T00:00:00"),
      ...(toParam ? { lte: new Date(toParam + "T23:59:59") } : {}),
    };
  }

  const [entries, user] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, hourlyRate: true },
    }),
  ]);

  return NextResponse.json({ entries, hourlyRate: user?.hourlyRate ?? null });
}
