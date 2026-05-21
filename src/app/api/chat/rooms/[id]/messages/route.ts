import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/chat/rooms/[id]/messages ────────────────────────────────────────
// ?limit=50          — initial load (default 50, max 100)
// ?after=ISO_STRING  — only messages created after this timestamp (for polling)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId } = session.user as { id: string };
  const { id: roomId } = await params;

  const member = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const after = url.searchParams.get("after");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

  const where = after
    ? { roomId, createdAt: { gt: new Date(after) } }
    : { roomId };

  const messages = await prisma.chatMessage.findMany({
    where,
    include: { author: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
    ...(after ? {} : { take: limit }),
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      authorId: m.authorId,
      authorName: m.author.name ?? "Usuario",
      authorAvatar: m.author.avatar,
      body: m.body,
      type: m.type,
      attachments: m.attachments ? JSON.parse(m.attachments) : [],
      createdAt: m.createdAt.toISOString(),
      editedAt: m.editedAt?.toISOString() ?? null,
    })),
  });
}

// ─── POST /api/chat/rooms/[id]/messages ───────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId } = session.user as { id: string };
  const { id: roomId } = await params;

  const member = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const msgBody: string | null = body?.body?.trim() || null;
  const msgType: string = body?.type ?? "text";
  const attachments: unknown[] = Array.isArray(body?.attachments) ? body.attachments : [];

  if (!msgBody && attachments.length === 0) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      authorId: userId,
      body: msgBody,
      type: msgType,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
    },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  // Update the sender's lastReadAt so their own send doesn't count as unread
  await prisma.chatRoomMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { lastReadAt: message.createdAt },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      authorId: message.authorId,
      authorName: message.author.name ?? "Usuario",
      authorAvatar: message.author.avatar,
      body: message.body,
      type: message.type,
      attachments: message.attachments ? JSON.parse(message.attachments) : [],
      createdAt: message.createdAt.toISOString(),
      editedAt: null,
    },
  });
}
