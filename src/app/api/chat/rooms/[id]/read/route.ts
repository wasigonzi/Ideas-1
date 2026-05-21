import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/chat/rooms/[id]/read — mark all messages as read for current user
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId } = session.user as { id: string };
  const { id: roomId } = await params;

  await prisma.chatRoomMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
