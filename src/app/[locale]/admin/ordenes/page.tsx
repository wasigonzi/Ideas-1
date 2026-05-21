import { prisma } from "@/lib/prisma";
import { OrdersManager } from "@/components/portal/OrdersManager";
import { loadTaskColumns } from "@/lib/task-columns";
import type { OrderCard } from "@/components/portal/OrderBoard";
import type { TaskCard } from "@/components/portal/TaskBoard";
import type { EditorUser } from "@/components/portal/TaskEditor";

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default async function AdminOrdenes() {
  const [orders, tasks, users, taskColumns] = await Promise.all([
    prisma.order.findMany({
      include: { client: true, tasks: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.task.findMany({
      include: { assignee: true, order: { include: { client: true } } },
      orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }]
    }),
    prisma.user.findMany({
      where: { role: { in: ["employee", "admin", "client"] } },
      select: { id: true, name: true, email: true, role: true, avatar: true, company: true },
      orderBy: [{ role: "asc" }, { name: "asc" }]
    }),
    loadTaskColumns()
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const visible = orders.filter((o) => o.status !== "cancelled");

  const cards: OrderCard[] = visible.map((o) => ({
    id: o.id,
    status: o.status,
    number: o.number,
    title: o.title,
    service: o.service,
    total: o.total,
    priority: o.priority,
    dueDate: o.dueDate ? o.dueDate.toISOString() : null,
    clientName: o.client.company ?? o.client.name,
    totalTasks: o.tasks.length,
    doneTasks: o.tasks.filter((t) => t.status === "done").length
  }));

  const taskCards: TaskCard[] = tasks.map((t) => {
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
      orderId: t.orderId ?? null,
      orderNumber: t.order?.number ?? null,
      clientName: t.order?.client?.company ?? t.order?.client?.name ?? null,
      coverImage: t.coverImage ?? null,
      attachments: parseStringArray(t.attachments),
      members: memberIds
        .map((id) => {
          const u = userMap.get(id);
          if (!u) return null;
          return { id: u.id, name: u.name ?? u.email, avatar: u.avatar ?? null, role: u.role };
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
    <OrdersManager
      orders={cards}
      tasks={taskCards}
      users={editorUsers}
      taskColumns={taskColumns}
      totalOrders={visible.length}
      cancelledOrders={orders.length - visible.length}
    />
  );
}
