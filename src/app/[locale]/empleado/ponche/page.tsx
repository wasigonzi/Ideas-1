import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PunchClock } from "@/components/portal/PunchClock";

export const dynamic = "force-dynamic";

export default async function PonchePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const shifts = await prisma.shift.findMany({
    where: { userId, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { start: "asc" }]
  });

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const recent = await prisma.punch.findMany({
    where: { userId, in: { gte: since } },
    orderBy: { in: "desc" }
  });

  const schedule = shifts.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    start: s.start,
    end: s.end,
    label: s.label
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Ponche</h1>
        <p className="text-white/65 mt-1">Registra tu entrada y salida.</p>
      </header>

      <PunchClock schedule={schedule} />

      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 mb-3">
          Últimos 7 días
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-white/55">Sin registros recientes.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-widest text-white/45">
                <tr>
                  <th className="text-left px-2 py-2">Fecha</th>
                  <th className="text-left px-2 py-2">Entrada</th>
                  <th className="text-left px-2 py-2">Salida</th>
                  <th className="text-right px-2 py-2">Horas</th>
                  <th className="text-left px-2 py-2 hidden sm:table-cell">Nota</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-2 py-2 capitalize text-white/85">
                      {new Date(p.in).toLocaleDateString("es-PR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short"
                      })}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {new Date(p.in).toLocaleTimeString("es-PR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {p.out
                        ? new Date(p.out).toLocaleTimeString("es-PR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })
                        : <span className="text-emerald-400 text-xs font-bold uppercase">abierto</span>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-bold">
                      {p.hours != null ? `${p.hours.toFixed(2)}h` : "—"}
                    </td>
                    <td className="px-2 py-2 text-white/55 hidden sm:table-cell">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
