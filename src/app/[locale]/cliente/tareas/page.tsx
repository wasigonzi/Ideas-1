import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ClientTaskView } from "@/components/portal/ClientTaskView";

const STATUS_ORDER: Record<string, number> = {
  pendientes:    0,
  espera:        1,
  arte:          2,
  produccion:    3,
  terminaciones: 4,
  instalacion:   5,
  facturar:      6,
  cerrado:       7,
  // legacy fallbacks
  in_progress: 1,
  review:      2,
  todo:        0,
  blocked:     1,
  done:        7,
};

export default async function ClienteTareas() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const raw = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { members: { contains: userId } },
        { taskMembers: { some: { userId } } },
      ]
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      checklistItems: {
        select: { id: true, text: true, done: true, position: true },
        orderBy: { position: "asc" },
      },
    },
  });

  const tasks = [...raw]
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      priority: t.priority,
      hours: t.hours,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      coverImage: t.coverImage ?? null,
      assigneeId: t.assigneeId ?? null,
      checklist: t.checklistItems.map((c) => ({ id: c.id, text: c.text, done: c.done })),
    }));

  const active = tasks.filter((t) => t.status !== "done" && t.status !== "cerrado");
  const done   = tasks.filter((t) => t.status === "done" || t.status === "cerrado");
  const all    = [...active, ...done];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mis tareas</h1>
        <p className="text-white/50 text-sm mt-1">
          {tasks.length === 0
            ? "No tienes tareas asignadas por el momento."
            : `${active.length} activa${active.length !== 1 ? "s" : ""} · ${done.length} completada${done.length !== 1 ? "s" : ""}`}
        </p>
      </header>

      <ClientTaskView tasks={all} currentUserId={userId || undefined} />
    </div>
  );
}
