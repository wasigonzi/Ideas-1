import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TaskBoard, type TaskCard } from "@/components/portal/TaskBoard";
import type { EditorUser } from "@/components/portal/TaskEditor";
import { loadTaskColumns } from "@/lib/task-columns";

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default async function AdminTareas() {
  const session = await auth();
  const currentUserId = (session?.user as { id?: string }).id ?? undefined;

  const [tasks, users, columns] = await Promise.all([
    prisma.task.findMany({
      include: { assignee: true },
      orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }]
    }),
    prisma.user.findMany({
      where: { role: { in: ["employee", "admin", "client"] } },
      select: { id: true, name: true, email: true, role: true, avatar: true, company: true },
      orderBy: [{ role: "asc" }, { name: "asc" }]
    }),
    loadTaskColumns()
  ]);

  // Quick lookup for resolving member ids → user info on each card.
  const userMap = new Map(users.map((u) => [u.id, u]));

  const cards: TaskCard[] = tasks.map((t) => {
    const memberIds = parseStringArray(t.members);
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
      members: memberIds
        .map((id) => {
          const u = userMap.get(id);
          if (!u) return null;
          return {
            id: u.id,
            name: u.name ?? u.email,
            avatar: u.avatar ?? null,
            role: u.role
          };
        })
        .filter((m): m is { id: string; name: string; avatar: string | null; role: string } => !!m)
    };
  });

  const editorUsers: EditorUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar ?? null,
    company: u.company ?? null
  }));
  return (
    <div className="space-y-6">
      <header>
          <h1 className="heading-lg">Tareas de Producción</h1>
        <p className="hidden sm:block text-white/65 mt-1">
          Tablero de producción — arrastra para cambiar el estado, o haz clic en una tarjeta para editarla.
        </p>
        <p className="sm:hidden text-xs text-white/55 mt-1">
          Toca una tarjeta para editarla.
        </p>
      </header>

      <TaskBoard tasks={cards} users={editorUsers} columns={columns} currentUserId={currentUserId} />
    </div>
  );
}