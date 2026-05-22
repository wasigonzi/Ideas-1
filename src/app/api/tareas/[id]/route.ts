import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ALLOWED_FIELDS = [
  "status", "priority", "title", "description", "assigneeId", "hours", "dueDate", "position", "coverImage", "attachments", "members", "orderId"
] as const;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!role || !actorId || !["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      let v = body[key];
      if (key === "dueDate") v = v ? new Date(v) : null;
      if (key === "hours") v = Number(v ?? 0);
      if (key === "position") v = Number(v ?? 0);
      if (key === "assigneeId") v = v || null;
      if (key === "coverImage") v = (v as string) || null;
      if (key === "attachments") {
        // Accept either an array of urls or an already-serialized string.
        if (Array.isArray(v)) v = JSON.stringify(v);
        else if (v == null || v === "") v = null;
        else if (typeof v !== "string") v = JSON.stringify(v);
      }
      if (key === "members") {
        if (Array.isArray(v)) v = JSON.stringify(v.filter((x) => typeof x === "string"));
        else if (v == null || v === "") v = null;
        else if (typeof v !== "string") v = JSON.stringify(v);
      }
      data[key] = v;
    }
  }
  if ("status" in data && data.status === "done") data.completedAt = new Date();

  // Fetch the previous task so we can compute a diff for the activity log.
  const before = await prisma.task.findUnique({ where: { id } });
  const task = await prisma.task.update({ where: { id }, data });

  // Log activity entries for human-meaningful changes only. Skip noise like
  // pure position reorders (Trello shows those silently too).
  if (before) {
    const events: { type: string; data: Record<string, unknown> }[] = [];
    if ("status" in data && before.status !== task.status) {
      events.push({ type: "status_changed", data: { from: before.status, to: task.status } });
    }
    if ("priority" in data && before.priority !== task.priority) {
      events.push({ type: "priority_changed", data: { from: before.priority, to: task.priority } });
    }
    if ("title" in data && before.title !== task.title) {
      events.push({ type: "title_changed", data: { from: before.title, to: task.title } });
    }
    if ("assigneeId" in data && (before.assigneeId ?? null) !== (task.assigneeId ?? null)) {
      events.push({ type: "assignee_changed", data: { from: before.assigneeId, to: task.assigneeId } });
    }
    if ("dueDate" in data && (before.dueDate?.toISOString() ?? null) !== (task.dueDate?.toISOString() ?? null)) {
      events.push({ type: "due_changed", data: { from: before.dueDate, to: task.dueDate } });
    }
    if ("members" in data && (before.members ?? null) !== (task.members ?? null)) {
      const prev: string[] = safeArr(before.members);
      const next: string[] = safeArr(task.members);
      const added = next.filter((x) => !prev.includes(x));
      const removed = prev.filter((x) => !next.includes(x));
      if (added.length) events.push({ type: "members_added", data: { ids: added } });
      if (removed.length) events.push({ type: "members_removed", data: { ids: removed } });
    }
    if ("attachments" in data && (before.attachments ?? null) !== (task.attachments ?? null)) {
      const prev: string[] = safeArr(before.attachments);
      const next: string[] = safeArr(task.attachments);
      const added = next.filter((x) => !prev.includes(x));
      const removed = prev.filter((x) => !next.includes(x));
      if (added.length) events.push({ type: "attachments_added", data: { urls: added } });
      if (removed.length) events.push({ type: "attachments_removed", data: { urls: removed } });
    }
    if ("coverImage" in data && (before.coverImage ?? null) !== (task.coverImage ?? null)) {
      events.push({ type: "cover_changed", data: { from: before.coverImage, to: task.coverImage } });
    }
    if (events.length) {
      await prisma.taskActivity.createMany({
        data: events.map((e) => ({
          taskId: id,
          actorId,
          type: e.type,
          data: JSON.stringify(e.data)
        }))
      });
    }
  }

  return NextResponse.json(task);
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

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
