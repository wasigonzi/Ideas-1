import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { StatCard, StatusPill } from "@/components/portal/PortalShell";
import { ClipboardList, Users, Receipt, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

const getAdminDashboard = unstable_cache(
  async () => {
    try {
    const [
      quotesNew, tasksOpen, userCounts,
      invoiceAgg, invoiceOverdue, latestQuotes, latestMessages,
    ] = await Promise.all([
      prisma.quote.count({ where: { status: "new" } }),
      prisma.task.count({ where: { status: { notIn: ["done"] } } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
        where: { role: { in: ["employee", "client"] } },
      }),
      prisma.invoice.aggregate({ _sum: { amount: true, paid: true } }),
      prisma.invoice.count({ where: { status: "overdue" } }),
      prisma.quote.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.message.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        include: { from: { select: { name: true, role: true } } },
      }),
    ]);
    return {
      quotesNew, tasksOpen, userCounts,
      invoiceAgg, invoiceOverdue, latestQuotes, latestMessages,
    };
    } catch {
      return {
        quotesNew: 0, tasksOpen: 0, userCounts: [],
        invoiceAgg: { _sum: { amount: null, paid: null } },
        invoiceOverdue: 0, latestQuotes: [], latestMessages: [],
      };
    }
  },
  ["admin-dashboard"],
  { revalidate: 30, tags: ["admin-dashboard"] },
);

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const {
    quotesNew, tasksOpen, userCounts,
    invoiceAgg, invoiceOverdue, latestQuotes, latestMessages,
  } = await getAdminDashboard();

  const employees = userCounts.find((c) => c.role === "employee")?._count._all ?? 0;
  const clients = userCounts.find((c) => c.role === "client")?._count._all ?? 0;

  const billed = invoiceAgg._sum.amount ?? 0;
  const collected = invoiceAgg._sum.paid ?? 0;
  const outstanding = billed - collected;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-lg">Dashboard</h1>
          <p className="text-white/65 mt-1">Visión general del negocio.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/admin/cotizaciones`} className="btn btn-outline">Ver cotizaciones</Link>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cotizaciones nuevas" value={quotesNew} accent="brand" hint="por revisar" />
        <StatCard label="Tareas abiertas" value={tasksOpen} accent="blue" />
        <StatCard label="Por cobrar" value={`$${outstanding.toLocaleString()}`} accent={invoiceOverdue ? "red" : "green"} hint={`${invoiceOverdue} vencidas`} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-500)]/15 grid place-items-center text-[var(--color-brand-400)]"><Users size={20} /></div>
          <div>
            <div className="text-xs uppercase text-white/55">Equipo</div>
            <div className="text-xl font-bold">{employees} empleados</div>
            <div className="text-xs text-white/55">{clients} clientes activos</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 grid place-items-center text-emerald-400"><Receipt size={20} /></div>
          <div>
            <div className="text-xs uppercase text-white/55">Cobrado</div>
            <div className="text-xl font-bold">${collected.toLocaleString()}</div>
            <div className="text-xs text-white/55">de ${billed.toLocaleString()} facturado</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 grid place-items-center text-sky-400"><TrendingUp size={20} /></div>
          <div>
            <div className="text-xs uppercase text-white/55">Conversión</div>
            <div className="text-xl font-bold">{billed > 0 ? Math.round((collected / billed) * 100) : 0}%</div>
            <div className="text-xs text-white/55">facturado vs cobrado</div>
          </div>
        </div>
      </div>

      <section className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><ClipboardList size={18} /> Últimas cotizaciones</h2>
          <ul className="divide-y divide-white/5">
            {latestQuotes.map((q) => (
              <li key={q.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{q.name}</div>
                  <div className="text-xs text-white/55">{q.email} · {q.service ?? "—"}</div>
                </div>
                <StatusPill status={q.status} />
              </li>
            ))}
            {latestQuotes.length === 0 && <p className="text-sm text-white/55">Sin cotizaciones.</p>}
          </ul>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-lg mb-4">Conversaciones recientes</h2>
        <ul className="space-y-3">
          {latestMessages.map((m) => (
            <li key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-9 h-9 rounded-full bg-[var(--color-brand-500)]/20 text-[var(--color-brand-400)] grid place-items-center text-xs font-bold shrink-0">
                {m.from.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs text-white/55">
                  <span><strong className="text-white/85">{m.from.name}</strong> ({m.from.role})</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm mt-1">{m.body}</p>
              </div>
            </li>
          ))}
          {latestMessages.length === 0 && <p className="text-sm text-white/55">Sin actividad.</p>}
        </ul>
      </section>

      {invoiceOverdue > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>{invoiceOverdue} factura(s) vencida(s).</strong> Revisa la sección de facturas para gestionar el cobro.
          </div>
        </div>
      )}
    </div>
  );
}
