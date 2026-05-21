import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/chat/rooms ─── list rooms for current user ──────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user as { id: string; role: string };
  if (!["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Ensure general room exists and user is a member
  let generalRoom = await prisma.chatRoom.findFirst({ where: { type: "general" } });
  if (!generalRoom) {
    generalRoom = await prisma.chatRoom.create({ data: { type: "general", name: "General" } });
  }
  await prisma.chatRoomMember.upsert({
    where: { roomId_userId: { roomId: generalRoom.id, userId } },
    create: { roomId: generalRoom.id, userId },
    update: {},
  });

  // Get all rooms user is a member of
  const memberships = await prisma.chatRoomMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatar: true, role: true, company: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { author: { select: { name: true } } },
          },
        },
      },
    },
  });

  const rooms = await Promise.all(
    memberships.map(async (m) => {
      const room = m.room;
      const lastMsg = room.messages[0] ?? null;
      const unread = await prisma.chatMessage.count({
        where: {
          roomId: room.id,
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
          authorId: { not: userId },
        },
      });
      return {
        id: room.id,
        type: room.type,
        name: room.name,
        unread,
        lastMessage: lastMsg
          ? {
              body: lastMsg.body,
              authorName: lastMsg.author.name ?? "Usuario",
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : null,
        members: room.members.map((mem) => ({
          id: mem.user.id,
          name: mem.user.name,
          avatar: mem.user.avatar,
          role: mem.user.role,
          company: mem.user.company,
        })),
      };
    })
  );

  // Sort: general first, then by last message desc
  rooms.sort((a, b) => {
    if (a.type === "general") return -1;
    if (b.type === "general") return 1;
    const aTime = a.lastMessage?.createdAt ?? a.id;
    const bTime = b.lastMessage?.createdAt ?? b.id;
    return bTime.localeCompare(aTime);
  });

  return NextResponse.json({ rooms });
}

// ─── POST /api/chat/rooms ─── create / get DM room ────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id: userId, role } = session.user as { id: string; role: string };
  if (!["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const targetId: string | undefined = body?.userId;
  if (!targetId || targetId === userId) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }

  // Find existing DM between these two users (exactly 2 members)
  const existing = await prisma.chatRoom.findFirst({
    where: {
      type: "direct",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetId } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, role: true, company: true } } },
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      room: {
        id: existing.id,
        type: existing.type,
        name: existing.name,
        unread: 0,
        lastMessage: null,
        members: existing.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatar: m.user.avatar,
          role: m.user.role,
          company: m.user.company,
        })),
      },
    });
  }

  const newRoom = await prisma.chatRoom.create({
    data: {
      type: "direct",
      members: { create: [{ userId }, { userId: targetId }] },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, role: true, company: true } } },
      },
    },
  });

  return NextResponse.json({
    room: {
      id: newRoom.id,
      type: newRoom.type,
      name: newRoom.name,
      unread: 0,
      lastMessage: null,
      members: newRoom.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar,
        role: m.user.role,
        company: m.user.company,
      })),
    },
  });
}
