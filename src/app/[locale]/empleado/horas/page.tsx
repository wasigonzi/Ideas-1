import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function EmpleadoHoras() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    include: { task: true },
    orderBy: { date: "desc" }
  });

  const total = entries.reduce((s, e) => s + e.hours, 0);
  const me = await prisma.user.findUnique({ where: { id: userId } });
  const earnings = me?.hourlyRate ? total * me.hourlyRate : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Horas registradas</h1>
        <p className="text-white/65 mt-1">Historial de tiempo trabajado.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55">Total horas</div>
          <div className="text-3xl font-extrabold mt-1">{total.toFixed(1)}h</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55">Tarifa por hora</div>
          <div className="text-3xl font-extrabold mt-1">${(me?.hourlyRate ?? 0).toFixed(2)}</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-[var(--color-brand-500)]/15 to-transparent">
          <div className="text-xs uppercase text-white/55">Estimado a cobrar</div>
          <div className="text-3xl font-extrabold mt-1 text-[var(--color-brand-400)]">${earnings.toFixed(2)}</div>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-lg mb-4">Detalle</h2>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Tarea</th>
                <th className="px-6 py-3">Nota</th>
                <th className="px-6 py-3 text-right">Horas</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <td className="px-6 py-3 text-white/70">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-medium">{e.task?.title ?? "—"}</td>
                  <td className="px-6 py-3 text-white/70">{e.note}</td>
                  <td className="px-6 py-3 text-right font-bold text-[var(--color-brand-400)]">{e.hours.toFixed(1)}h</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-white/55">Sin registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
