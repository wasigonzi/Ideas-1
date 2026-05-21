"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Square, Loader2, Coffee } from "lucide-react";

type PunchState = {
  open: { id: string; in: string; note?: string | null } | null;
  openBreak: { id: string; start: string } | null;
  today: { date: string; hours: number; count: number };
  week: { hours: number };
};

export function PunchClock({ schedule }: { schedule: { dayOfWeek: number; start: string; end: string; label: string | null }[] }) {
  const [now, setNow] = useState<Date | null>(null);
  const [state, setState] = useState<PunchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);

  // Load initial status
  useEffect(() => {
    refresh();
    setNow(new Date());
    tickRef.current = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  async function refresh() {
    try {
      const r = await fetch("/api/ponche", { cache: "no-store" });
      const j = await r.json();
      setState(j);
    } catch {
      /* ignore */
    }
  }

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ponche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || null })
      });
      if (!r.ok) throw new Error("save failed");
      setNote("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function breakAction(action: "break_start" | "break_end") {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ponche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!r.ok) throw new Error("save failed");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const isClockedIn = !!state?.open;
  const isOnBreak = !!state?.openBreak;
  const inSince = state?.open ? new Date(state.open.in) : null;
  const elapsedMs = isClockedIn && inSince && now ? now.getTime() - inSince.getTime() : 0;
  const elapsed = formatDuration(elapsedMs);
  const breakSince = state?.openBreak ? new Date(state.openBreak.start) : null;
  const breakElapsedMs = isOnBreak && breakSince && now ? now.getTime() - breakSince.getTime() : 0;
  const breakElapsed = formatDuration(breakElapsedMs);

  // Today's shift (if any)
  const todayDow = now?.getDay() ?? new Date().getDay();
  const todayShift = schedule.find((s) => s.dayOfWeek === todayDow);

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
      {/* MAIN PUNCH CARD */}
      <div className="card p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full">
          <div className="text-xs uppercase tracking-widest text-white/55 mb-2 flex items-center justify-center gap-2">
            <Clock size={14} /> Hora actual
          </div>
          <div className="text-5xl sm:text-6xl font-extrabold tabular-nums">
            {now ? now.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
          </div>
          <div className="text-sm text-white/55 mt-1 capitalize">
            {now ? now.toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          </div>

          <AnimatePresence mode="wait">
            {isClockedIn ? (
              <motion.div
                key={isOnBreak ? "break" : "in"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8"
              >
                {isOnBreak ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      En descanso
                    </div>
                    <div className="mt-4 text-3xl font-extrabold tabular-nums text-amber-300">{breakElapsed}</div>
                    <div className="text-xs text-white/55 mt-1">
                      Descanso desde {breakSince!.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Trabajando
                    </div>
                    <div className="mt-4 text-3xl font-extrabold tabular-nums text-emerald-300">{elapsed}</div>
                    <div className="text-xs text-white/55 mt-1">
                      Desde {inSince!.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="out"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/65 text-xs font-bold uppercase tracking-wider">
                  Sin ponchar
                </div>
                {todayShift && (
                  <div className="text-sm text-white/55 mt-3">
                    <span className="text-white/90 font-semibold">{to12h(todayShift.start)} – {to12h(todayShift.end)}</span>
                    {todayShift.label && <span className="text-white/45"> · {todayShift.label}</span>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!isOnBreak && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isClockedIn ? "Nota al ponchar salida (opcional)" : "Nota al ponchar entrada (opcional)"}
              className="mt-6 w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-brand-500)]/60"
            />
          )}

          <div className="mt-5 w-full max-w-md mx-auto space-y-3">
            {isClockedIn ? (
              isOnBreak ? (
                <button
                  onClick={() => breakAction("break_end")}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl text-lg font-extrabold tracking-wide shadow-2xl transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-white"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" /> Terminar descanso</>}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => breakAction("break_start")}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl text-lg font-extrabold tracking-wide shadow-2xl transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 text-white"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Coffee size={22} /> Iniciar descanso</>}
                  </button>
                  <button
                    onClick={toggle}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl text-base font-bold tracking-wide border border-red-500/40 text-red-400 hover:bg-red-500/10 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Square fill="currentColor" size={18} /> Ponchar salida</>}
                  </button>
                </>
              )
            ) : (
              <button
                onClick={toggle}
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl text-lg font-extrabold tracking-wide shadow-2xl transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-[var(--color-brand-500)] hover:brightness-110 text-[var(--color-ink-950,#060b14)]"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" /> Ponchar entrada</>}
              </button>
            )}
          </div>

          {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
        </div>
      </div>

      {/* SIDE: stats + week */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/55">Hoy</div>
            <div className="text-3xl font-extrabold mt-1 tabular-nums">{(state?.today.hours ?? 0).toFixed(2)}h</div>
            <div className="text-[11px] text-white/45 mt-1">{state?.today.count ?? 0} ponche(s)</div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/55">Esta semana</div>
            <div className="text-3xl font-extrabold mt-1 tabular-nums text-[var(--color-brand-400)]">
              {(state?.week.hours ?? 0).toFixed(2)}h
            </div>
            <div className="text-[11px] text-white/45 mt-1">de 40h objetivo</div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 mb-3">Mi horario</h3>
          {schedule.length === 0 ? (
            <p className="text-sm text-white/55">Sin horario asignado.</p>
          ) : (
            <ul className="space-y-1.5">
              {schedule.map((s, i) => {
                const today = s.dayOfWeek === todayDow;
                return (
                  <li
                    key={i}
                    className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                      today ? "bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/30" : "bg-white/5"
                    }`}
                  >
                    <span className={today ? "font-bold text-[var(--color-brand-400)]" : "text-white/80"}>
                      {DAYS[s.dayOfWeek]}
                      {today && <span className="ml-2 text-[10px] uppercase">hoy</span>}
                    </span>
                    <span className="tabular-nums text-white/70">
                      {to12h(s.start)} – {to12h(s.end)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
