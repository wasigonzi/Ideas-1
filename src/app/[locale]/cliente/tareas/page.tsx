import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ClientTaskView } from "@/components/portal/ClientTaskView";

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  review:      1,
  todo:        2,
  produccion:  3,
  blocked:     4,
  done:        5,
};

export default async function ClienteTareas() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const raw = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { members: { contains: userId } },
      ]
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
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
    }));

  const active = tasks.filter((t) => t.status !== "done");
  const done   = tasks.filter((t) => t.status === "done");
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
