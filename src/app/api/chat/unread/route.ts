import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/chat/unread — total unread messages across all rooms
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });
  const { id: userId } = session.user as { id: string };

  const memberships = await prisma.chatRoomMember.findMany({ where: { userId } });

  let total = 0;
  for (const m of memberships) {
    const count = await prisma.chatMessage.count({
      where: {
        roomId: m.roomId,
        createdAt: { gt: m.lastReadAt ?? new Date(0) },
        authorId: { not: userId },
      },
    });
    total += count;
  }

  return NextResponse.json({ count: total });
}
