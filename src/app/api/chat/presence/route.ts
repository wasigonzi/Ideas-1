import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PRESENCE_KEY = "chat:presence";

// ─── GET /api/chat/presence ─── returns map of { userId: lastSeenISO } ───────
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: PRESENCE_KEY } });
    const presence: Record<string, string> = row?.value ? JSON.parse(row.value) : {};
    return NextResponse.json({ presence });
  } catch {
    return NextResponse.json({ presence: {} });
  }
}

// ─── POST /api/chat/presence ─── heartbeat: update current user lastSeen ────
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId } = session.user as { id: string };

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: PRESENCE_KEY } });
    const presence: Record<string, string> = row?.value ? JSON.parse(row.value) : {};
    presence[userId] = new Date().toISOString();

    // Evict entries older than 10 minutes to keep payload small
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [uid, ts] of Object.entries(presence)) {
      if (new Date(ts).getTime() < cutoff) delete presence[uid];
    }

    await prisma.siteSetting.upsert({
      where: { key: PRESENCE_KEY },
      update: { value: JSON.stringify(presence) },
      create: { key: PRESENCE_KEY, value: JSON.stringify(presence) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
