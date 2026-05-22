import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { currentPeriod, listRecentPeriods, DEFAULT_ANCHOR } from "@/lib/pay-periods";

// GET /api/horas/nomina?periods=N — per-period payroll summary (admin only)
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const count = Math.min(Math.max(Number(req.nextUrl.searchParams.get("periods") ?? 6), 1), 24);

  // Fetch anchor from settings (fall back to default)
  const anchorRow = await prisma.siteSetting.findUnique({ where: { key: "payroll_anchor" } });
  const anchor = anchorRow?.value ?? DEFAULT_ANCHOR;

  const periods = listRecentPeriods(anchor, count);

  // Fetch all entries for the range [oldest period start .. today]
  const oldest = periods[periods.length - 1];
  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: oldest.start } },
    include: {
      user: { select: { id: true, name: true, email: true, hourlyRate: true } },
    },
    orderBy: { date: "asc" },
  });

  // Bucket entries into periods
  const result = periods.map((p) => {
    const inPeriod = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= p.start && d <= new Date(p.end.getTime() + 86_400_000 - 1);
    });

    // Per-employee summary
    const byEmployee = new Map<string, {
      userId: string;
      name: string;
      email: string;
      hourlyRate: number | null;
      hours: number;
      gross: number;
      entries: number;
    }>();

    for (const e of inPeriod) {
      const key = e.userId;
      const existing = byEmployee.get(key) ?? {
        userId: e.user.id,
        name: e.user.name ?? e.user.email,
        email: e.user.email,
        hourlyRate: e.user.hourlyRate,
        hours: 0,
        gross: 0,
        entries: 0,
      };
      existing.hours += e.hours;
      existing.gross += e.hours * (e.user.hourlyRate ?? 0);
      existing.entries += 1;
      byEmployee.set(key, existing);
    }

    const employees = [...byEmployee.values()].sort((a, b) => b.hours - a.hours);
    const totalHours = employees.reduce((s, e) => s + e.hours, 0);
    const totalGross = employees.reduce((s, e) => s + e.gross, 0);

    return {
      key: p.key,
      label: p.label,
      start: p.start.toISOString(),
      end: p.end.toISOString(),
      isCurrent: p.isCurrent,
      totalHours,
      totalGross,
      employees,
    };
  });

  return NextResponse.json({ anchor, periods: result });
}
