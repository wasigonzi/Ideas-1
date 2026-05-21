import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default async function EmpleadoHorario() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const shifts = await prisma.shift.findMany({
    where: { userId, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { start: "asc" }]
  });

  // Build a map: dayOfWeek → shifts[]
  const byDay = new Map<number, typeof shifts>();
  for (const s of shifts) {
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  }

  const todayDow = new Date().getDay();
  const totalHours = shifts.reduce((sum, s) => {
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mi horario</h1>
        <p className="text-white/65 mt-1">Tu turno semanal asignado.</p>
      </header>

      {shifts.length === 0 ? (
        <div className="card p-10 text-center text-white/55">
          No tienes un horario asignado aún. Contacta a tu administrador.
        </div>
      ) : (
        <>
          {/* Weekly summary */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="text-xs uppercase text-white/55 tracking-wider">Días por semana</div>
              <div className="text-3xl font-extrabold mt-1">{byDay.size}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase text-white/55 tracking-wider">Horas semanales</div>
              <div className="text-3xl font-extrabold mt-1">{totalHours.toFixed(1)}h</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase text-white/55 tracking-wider">Hoy</div>
              <div className="text-lg font-extrabold mt-1">
                {byDay.has(todayDow)
                  ? byDay.get(todayDow)!.map((s) => `${to12h(s.start)} – ${to12h(s.end)}`).join(", ")
                  : <span className="text-white/40">Día libre</span>}
              </div>
            </div>
          </div>

          {/* Day grid */}
          <div className="card p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 mb-4">Semana</h3>
            <div className="grid gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                const dayShifts = byDay.get(dow);
                const isToday = dow === todayDow;
                return (
                  <div
                    key={dow}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition ${
                      isToday
                        ? "border-[var(--color-brand-500)]/50 bg-[var(--color-brand-500)]/8"
                        : dayShifts
                        ? "border-white/10 bg-white/3"
                        : "border-white/5 opacity-40"
                    }`}
                  >
                    <div className={`w-24 text-sm font-bold shrink-0 ${isToday ? "text-[var(--color-brand-400)]" : "text-white/75"}`}>
                      {DAYS[dow]}
                      {isToday && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-400)]">hoy</span>}
                    </div>
                    {dayShifts ? (
                      <div className="flex flex-wrap gap-2">
                        {dayShifts.map((s) => (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="text-white font-semibold tabular-nums">
                              {to12h(s.start)} – {to12h(s.end)}
                            </span>
                            {s.label && (
                              <span className="text-xs text-white/45 bg-white/8 px-2 py-0.5 rounded-full">
                                {s.label}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-white/35">Día libre</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
