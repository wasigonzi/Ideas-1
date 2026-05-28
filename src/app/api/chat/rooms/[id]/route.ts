import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── DELETE /api/chat/rooms/[id] ─── leave / delete a room ──────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId } = session.user as { id: string; role: string };
  const { id: roomId } = await params;

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: { members: true },
  });
  if (!room) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // General room cannot be deleted
  if (room.type === "general") {
    return NextResponse.json({ error: "cannot_delete_general" }, { status: 400 });
  }

  // Caller must be a member
  const isMember = room.members.some((m) => m.userId === userId);
  if (!isMember) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // For DMs with exactly 2 members: delete the whole room (cascades messages)
  await prisma.chatRoom.delete({ where: { id: roomId } });

  return NextResponse.json({ ok: true });
}
