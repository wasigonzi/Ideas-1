import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/chat/unread — total unread messages across all rooms
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });
  const { id: userId } = session.user as { id: string };

  const memberships = await prisma.chatRoomMember.findMany({ where: { userId } });
  if (memberships.length === 0) return NextResponse.json({ count: 0 });

  // Single aggregated query instead of N+1 per room
  const counts = await prisma.chatMessage.groupBy({
    by: ["roomId"],
    where: {
      roomId: { in: memberships.map((m) => m.roomId) },
      authorId: { not: userId },
    },
    _count: { id: true },
  });

  const lastReadMap = new Map(memberships.map((m) => [m.roomId, m.lastReadAt ?? new Date(0)]));

  // Filter by lastReadAt per room (groupBy doesn't support per-row conditions)
  let total = 0;
  for (const row of counts) {
    const since = lastReadMap.get(row.roomId) ?? new Date(0);
    const count = await prisma.chatMessage.count({
      where: {
        roomId: row.roomId,
        createdAt: { gt: since },
        authorId: { not: userId },
      },
    });
    total += count;
  }

  return NextResponse.json({ count: total });
}
