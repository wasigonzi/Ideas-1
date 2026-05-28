import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { StatCard, StatusPill, PriorityPill } from "@/components/portal/PortalShell";
import { CheckCircle2, ListChecks, Hourglass, Flame, ClipboardList } from "lucide-react";

export default async function EmpleadoDashboard() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayStart = new Date(todayStr + "T00:00:00.000Z");

  const [tasks, timeEntries, todayNote] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: userId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }]
    }),
    prisma.timeEntry.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10 }),
    prisma.dailyNote.findUnique({ where: { userId_date: { userId, date: todayStart } } })
  ]);

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "done");
  const totalHours = timeEntries.reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="heading-lg">Hola, {session?.user?.name?.split(" ")[0]}</h1>
        <p className="text-white/65 mt-1">Tu carga de trabajo de hoy.</p>
      </header>

      {todayNote && (
        <div className="card p-5 border-l-4 border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/5">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-brand-400)] text-xs font-bold uppercase tracking-widest">
            <ClipboardList size={13} /> Instrucciones de hoy
          </div>
          <p className="text-white/90 text-sm whitespace-pre-wrap">{todayNote.content}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tareas abiertas" value={open.length} accent="brand" hint={<><ListChecks size={12} className="inline" /> en curso o por hacer</> as unknown as string} />
        <StatCard label="Completadas" value={done.length} accent="green" hint="histórico" />
        <StatCard label="Urgentes" value={urgent.length} accent="red" hint="prioridad alta" />
        <StatCard label="Horas (10 últimas)" value={totalHours.toFixed(1)} accent="blue" hint="registradas" />
      </div>

      <section className="card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Tareas asignadas</h2>
          <span className="text-xs text-white/55">{tasks.length} totales</span>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Tarea</th>
                <th className="px-6 py-3">Vence</th>
                <th className="px-6 py-3">Prioridad</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-6 py-3 font-medium">{t.title}</td>
                  <td className="px-6 py-3 text-white/70">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-3"><PriorityPill priority={t.priority} /></td>
                  <td className="px-6 py-3"><StatusPill status={t.status} /></td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-white/55">No tienes tareas asignadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Flame size={18} className="text-red-400" /> Foco de hoy</h2>
          <ul className="space-y-3">
            {urgent.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                <Hourglass size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-white/55 mt-0.5">vence {t.dueDate?.toLocaleDateString()}</div>
                </div>
              </li>
            ))}
            {urgent.length === 0 && <p className="text-sm text-white/55">Sin urgentes 🎉</p>}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /> Últimas horas registradas</h2>
          <ul className="divide-y divide-white/5">
            {timeEntries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="text-white/85">{e.note ?? "Trabajo"}</div>
                  <div className="text-xs text-white/55">{new Date(e.date).toLocaleDateString()}</div>
                </div>
                <span className="font-bold text-[var(--color-brand-400)]">{e.hours.toFixed(1)}h</span>
              </li>
            ))}
            {timeEntries.length === 0 && <p className="text-sm text-white/55">Sin registros aún.</p>}
          </ul>
        </div>
      </section>
    </div>
  );
}
