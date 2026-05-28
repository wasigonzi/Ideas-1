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

  const lastReadMap = new Map(memberships.map((m) => [m.roomId, m.lastReadAt ?? new Date(0)]));

  // Fetch all potentially-unread messages in a single query and filter in-memory
  // to avoid the N+1 anti-pattern (one count query per room).
  const roomIds = memberships.map((m) => m.roomId);
  const msgs = await prisma.chatMessage.findMany({
    where: { roomId: { in: roomIds }, authorId: { not: userId } },
    select: { roomId: true, createdAt: true },
  });

  let total = 0;
  for (const msg of msgs) {
    const since = lastReadMap.get(msg.roomId) ?? new Date(0);
    if (msg.createdAt > since) total++;
  }

  return NextResponse.json({ count: total });
}
