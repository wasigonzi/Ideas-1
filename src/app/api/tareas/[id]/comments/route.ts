import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/tareas/[id]/comments
// Returns the merged feed of comments + activity for a task, oldest first.
// Each entry is normalized with { kind, id, createdAt, actor, ... }.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const [comments, activities, views] = await Promise.all([
    prisma.taskComment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.taskActivity.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.taskView.findMany({
      where: { taskId: id },
      orderBy: { seenAt: "desc" }
    })
  ]);

  // Resolve all referenced user ids in one query for actor + payload subjects.
  const userIds = new Set<string>();
  comments.forEach((c) => {
    userIds.add(c.authorId);
    safeArr(c.mentions).forEach((id) => userIds.add(id));
  });
  activities.forEach((a) => {
    userIds.add(a.actorId);
    try {
      const data = a.data ? JSON.parse(a.data) : null;
      if (data && Array.isArray(data.ids)) {
        for (const x of data.ids) if (typeof x === "string") userIds.add(x);
      }
      if (data && typeof data.from === "string" && a.type === "assignee_changed") userIds.add(data.from);
      if (data && typeof data.to === "string" && a.type === "assignee_changed") userIds.add(data.to);
    } catch {
      /* ignore */
    }
  });

  const users = userIds.size
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, name: true, email: true, avatar: true, role: true }
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  function actorOf(uid: string) {
    const u = userMap.get(uid);
    if (!u) return { id: uid, name: "Usuario", avatar: null, role: "unknown" };
    return { id: u.id, name: u.name ?? u.email, avatar: u.avatar ?? null, role: u.role };
  }

  const feed = [
    ...comments.map((c) => {
      const mentionIds = safeArr(c.mentions);
      const mentions = mentionIds.map((id) => {
        const u = userMap.get(id);
        return { id, name: u?.name ?? u?.email ?? "Usuario" };
      });
      let attachments: Array<{ url: string; name?: string; type?: string; kind?: string }> = [];
      if (c.attachments) {
        try {
          const v = JSON.parse(c.attachments);
          if (Array.isArray(v)) {
            attachments = v
              .map((a) => {
                if (typeof a === "string") return { url: a };
                if (a && typeof a === "object" && typeof a.url === "string") return a;
                return null;
              })
              .filter((x): x is { url: string } => !!x);
          }
        } catch {
          /* ignore */
        }
      }
      return {
        kind: "comment" as const,
        id: c.id,
        createdAt: c.createdAt,
        actor: actorOf(c.authorId),
        body: c.body,
        mentions,
        attachments
      };
    }),
    ...activities.map((a) => {
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = a.data ? (JSON.parse(a.data) as Record<string, unknown>) : null;
      } catch {
        parsed = null;
      }
      // Resolve referenced user ids inside payload to friendly names where useful.
      const subjects: { id: string; name: string }[] = [];
      if (parsed && Array.isArray(parsed.ids)) {
        for (const x of parsed.ids) {
          if (typeof x === "string") {
            const u = userMap.get(x);
            subjects.push({ id: x, name: u?.name ?? u?.email ?? "Usuario" });
          }
        }
      }
      return {
        kind: "activity" as const,
        id: a.id,
        createdAt: a.createdAt,
        actor: actorOf(a.actorId),
        type: a.type,
        data: parsed,
        subjects
      };
    })
  ].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const viewers = views.map((v) => ({
    userId: v.userId,
    name: v.name,
    avatar: v.avatar,
    seenAt: v.seenAt
  }));

  return NextResponse.json({ feed, viewers });
}

// POST /api/tareas/[id]/comments  { body: string, attachments?, mentions? }
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!actorId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const body = typeof json?.body === "string" ? json.body.trim() : "";
  const rawAttachments = Array.isArray(json?.attachments) ? json.attachments : [];
  const rawMentions = Array.isArray(json?.mentions) ? json.mentions : [];

  // Normalize attachments to { url, name, type, kind }.
  const attachments = rawAttachments
    .map((a: unknown) => {
      if (typeof a === "string") return { url: a };
      if (a && typeof a === "object" && typeof (a as { url?: unknown }).url === "string") {
        const o = a as { url: string; name?: unknown; type?: unknown; kind?: unknown };
        return {
          url: o.url,
          name: typeof o.name === "string" ? o.name : undefined,
          type: typeof o.type === "string" ? o.type : undefined,
          kind: typeof o.kind === "string" ? o.kind : undefined
        };
      }
      return null;
    })
    .filter((x): x is { url: string } => !!x);

  const mentions = rawMentions.filter((x: unknown): x is string => typeof x === "string");

  if (!body && attachments.length === 0) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  if (body.length > 5000) return NextResponse.json({ error: "too_long" }, { status: 400 });

  // Ensure the task exists; relation FK will also enforce this.
  const exists = await prisma.task.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const comment = await prisma.taskComment.create({
    data: {
      taskId: id,
      authorId: actorId,
      body,
      attachments: attachments.length ? JSON.stringify(attachments) : null,
      mentions: mentions.length ? JSON.stringify(mentions) : null
    }
  });
  return NextResponse.json({ comment });
}

function safeArr(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
