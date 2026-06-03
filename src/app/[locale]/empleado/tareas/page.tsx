import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { loadTaskColumns } from "@/lib/task-columns";
import { TaskBoard, type TaskCard } from "@/components/portal/TaskBoard";

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default async function EmpleadoTareas() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const [tasks, columns] = await Promise.all([
    prisma.task.findMany({
      where: {
        archived: false,
        OR: [
          { assigneeId: userId },
          { members: { contains: userId } },
          { taskMembers: { some: { userId } } },
        ],
      },
      include: {
        assignee: true,
        taskMembers: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
        workSessions: {
          where: { userId },
          select: { id: true, startedAt: true, endedAt: true },
        },
      },
      orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    }),
    loadTaskColumns(),
  ]);

  // Resolve member ids for avatar display
  const memberIds = Array.from(
    new Set(tasks.flatMap((t) => parseStringArray(t.members)))
  );
  const memberUsers = memberIds.length
    ? await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, name: true, email: true, avatar: true, role: true },
      })
    : [];
  const userMap = new Map(memberUsers.map((u) => [u.id, u]));

  const cards: TaskCard[] = tasks.map((t) => {
    // Sum seconds from all ended sessions
    const loggedSeconds = t.workSessions
      .filter((s) => s.endedAt !== null)
      .reduce((sum, s) => {
        return sum + Math.round((s.endedAt!.getTime() - s.startedAt.getTime()) / 1000);
      }, 0);

    // Find active (open) session
    const open = t.workSessions.find((s) => s.endedAt === null) ?? null;

    return {
      id: t.id,
      status: t.status,
      position: t.position,
      title: t.title,
      description: t.description ?? null,
      priority: t.priority,
      hours: t.hours,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assigneeId: t.assigneeId ?? null,
      assigneeName: t.assignee?.name ?? null,
      coverImage: t.coverImage ?? null,
      attachments: parseStringArray(t.attachments),
      members: Array.from(new Set([
        ...parseStringArray(t.members),
        ...t.taskMembers.map((member) => member.userId),
      ]))
        .map((id) => {
          const u = userMap.get(id) ?? t.taskMembers.find((member) => member.userId === id)?.user;
          if (!u) return null;
          return { id: u.id, name: u.name ?? u.email, avatar: u.avatar ?? null, role: u.role };
        })
        .filter((m): m is { id: string; name: string; avatar: string | null; role: string } => !!m),
      loggedSeconds,
      activeSession: open
        ? { id: open.id, startedAt: open.startedAt.toISOString() }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mis tareas</h1>
        <p className="hidden sm:block text-white/65 mt-1">
          Haz clic en una tarea para iniciar el temporizador y enviarla para aprobación.
        </p>
      </header>

      <TaskBoard
        tasks={cards}
        users={[]}
        canEdit={false}
        columns={columns}
        currentUserId={userId}
      />
    </div>
  );
}
