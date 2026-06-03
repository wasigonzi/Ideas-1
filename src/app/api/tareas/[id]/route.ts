import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendTaskAssignedEmail } from "@/lib/mailer";
import { enforceTaskCompletionRules, safeStringArray } from "@/lib/workflow";

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
  // Fetch the previous task so we can compute a diff for the activity log
  // and enforce the "regla de oro" before allowing completion.
  const before = await prisma.task.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Regla de oro: una tarea no puede marcarse "done" sin evidencia (foto),
  // sin el checklist completo, y —si pertenece a un proyecto— sin aprobación.
  if ("status" in data && data.status === "done" && before.status !== "done") {
    const guard = await enforceTaskCompletionRules(id, before);
    if (guard) return guard;
  }

  if ("status" in data && data.status === "done") data.completedAt = new Date();

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
      const prev: string[] = safeStringArray(before.members);
      const next: string[] = safeStringArray(task.members);
      const added = next.filter((x) => !prev.includes(x));
      const removed = prev.filter((x) => !next.includes(x));
      if (added.length) events.push({ type: "members_added", data: { ids: added } });
      if (removed.length) events.push({ type: "members_removed", data: { ids: removed } });
    }
    if ("attachments" in data && (before.attachments ?? null) !== (task.attachments ?? null)) {
      const prev: string[] = safeStringArray(before.attachments);
      const next: string[] = safeStringArray(task.attachments);
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

    // Send assignment notification (fire-and-forget, never fail the request)
    if (
      "assigneeId" in data &&
      task.assigneeId &&
      task.assigneeId !== before.assigneeId &&
      task.assigneeId !== actorId
    ) {
      prisma.user
        .findUnique({ where: { id: task.assigneeId }, select: { email: true, name: true } })
        .then((u) => {
          if (!u) return;
          const actor = (session!.user as { name?: string | null }).name ?? "Alguien";
          return sendTaskAssignedEmail({
            toEmail: u.email,
            toName: u.name ?? u.email,
            taskTitle: task.title,
            taskId: id,
            assignedByName: actor,
          });
        })
        .catch(() => null);
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
