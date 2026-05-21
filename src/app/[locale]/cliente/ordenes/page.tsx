import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { StatusPill, PriorityPill, ProgressBar } from "@/components/portal/PortalShell";

export default async function ClienteOrdenes() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const orders = await prisma.order.findMany({
    where: { clientId: userId },
    include: { tasks: { include: { assignee: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mis órdenes</h1>
        <p className="text-white/65 mt-1">Detalle completo de cada proyecto.</p>
      </header>

      <div className="space-y-5">
        {orders.map((o) => {
          const total = o.tasks.length;
          const done = o.tasks.filter((t) => t.status === "done").length;
          return (
            <article key={o.id} className="card p-6">
              <header className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-white/55">{o.number}</div>
                  <h2 className="font-bold text-xl mt-0.5">{o.title}</h2>
                  <div className="text-xs text-white/55 mt-1">{o.service}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={o.status} />
                  <PriorityPill priority={o.priority} />
                </div>
              </header>

              {o.description && <p className="mt-4 text-sm text-white/75">{o.description}</p>}

              <div className="grid sm:grid-cols-4 gap-4 mt-5 text-sm">
                <div>
                  <div className="text-xs text-white/55">Inicio</div>
                  <div className="font-medium">{o.startDate?.toLocaleDateString() ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/55">Entrega</div>
                  <div className="font-medium">{o.dueDate?.toLocaleDateString() ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/55">Total</div>
                  <div className="font-bold text-[var(--color-brand-400)]">${o.total.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-white/55">Pagado</div>
                  <div className="font-medium">${o.paid.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/55 mb-1">
                  <span>Avance del proyecto</span><span>{done}/{total} tareas</span>
                </div>
                <ProgressBar value={done} max={total || 1} />
              </div>

              {o.tasks.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wider text-white/55 mb-2">Tareas</div>
                  <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
                    {o.tasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.title}</div>
                          <div className="text-xs text-white/55">{t.assignee?.name ?? "Sin asignar"}</div>
                        </div>
                        <StatusPill status={t.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
        {orders.length === 0 && <p className="text-white/55">Aún no tienes órdenes registradas.</p>}
      </div>
    </div>
  );
}
