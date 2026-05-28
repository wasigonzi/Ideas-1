"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Clock, ChevronLeft, ChevronRight, DollarSign, CalendarDays, Loader2 } from "lucide-react";
import { listRecentPeriods, currentPeriod, DEFAULT_ANCHOR, localISODate, formatPayday } from "@/lib/pay-periods";

type EntryTask = { id: string; title: string } | null;
type Entry = { id: string; hours: number; note: string | null; date: string; task: EntryTask };

type Period = { key: string; label: string; start: string; end: string; isCurrent: boolean; end_raw: Date };

const ALL_PERIODS: Period[] = listRecentPeriods(DEFAULT_ANCHOR, 12).map((p) => ({
  key: p.key,
  label: p.label,
  start: localISODate(p.start),
  end: localISODate(p.end),
  isCurrent: p.isCurrent,
  end_raw: p.end,
}));

export default function EmpleadoHoras() {
  const [periodIdx, setPeriodIdx] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedPeriod = ALL_PERIODS[periodIdx];

  const load = useCallback(async (period: Period) => {
    setLoading(true);
    setError("");
    const r = await fetch(`/api/horas/me?from=${period.start}&to=${period.end}`);
    if (r.ok) {
      const data = await r.json();
      setEntries(data.entries ?? []);
      setHourlyRate(data.hourlyRate ?? null);
    } else {
      setError("No se pudieron cargar las horas. Intenta de nuevo.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(selectedPeriod); }, [selectedPeriod, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalHours = useMemo(() => entries.reduce((s, e) => s + e.hours, 0), [entries]);
  const earnings = useMemo(() => (hourlyRate ? totalHours * hourlyRate : 0), [totalHours, hourlyRate]);

  // Days until payday
  const daysUntilPay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((selectedPeriod.end_raw.getTime() - today.getTime()) / 86_400_000);
    return diff;
  }, [selectedPeriod]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mis nóminas</h1>
        <p className="text-white/65 mt-1">Horas trabajadas y estimado de pago bisemanal.</p>
      </header>

      {error && (
        <div className="card p-4 border border-red-500/40 bg-red-500/8 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Period navigator */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPeriodIdx((i) => Math.min(i + 1, ALL_PERIODS.length - 1))}
            disabled={periodIdx >= ALL_PERIODS.length - 1}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-25 transition"
            title="Período anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-xs uppercase tracking-wider text-white/45 mb-0.5">Período de pago</div>
            <div className="font-bold text-white">
              {selectedPeriod.isCurrent && <span className="text-[var(--color-brand-400)] mr-1.5">✦</span>}
              {selectedPeriod.label}
            </div>
          </div>
          <button
            onClick={() => setPeriodIdx((i) => Math.max(i - 1, 0))}
            disabled={periodIdx === 0}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-25 transition"
            title="Período siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Payday info */}
        <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-white/55">
            <DollarSign size={14} className="text-emerald-400" />
            <span>Día de pago: <span className="text-white/80 font-semibold">{formatPayday(selectedPeriod.end_raw)}</span></span>
          </div>
          {selectedPeriod.isCurrent && daysUntilPay >= 0 && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
              daysUntilPay === 0
                ? "bg-emerald-500/20 text-emerald-400"
                : daysUntilPay <= 3
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/8 text-white/55"
            }`}>
              {daysUntilPay === 0 ? "¡Hoy es día de pago!" : `${daysUntilPay} día(s) para cobrar`}
            </span>
          )}
          {daysUntilPay < 0 && (
            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/35">Período pasado</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55 flex items-center gap-1.5"><Clock size={12} /> Horas del período</div>
          <div className="text-3xl font-extrabold mt-1">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-white/45 mt-1">{entries.length} registro(s)</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55 flex items-center gap-1.5"><CalendarDays size={12} /> Tarifa por hora</div>
          <div className="text-3xl font-extrabold mt-1">
            {hourlyRate != null ? `$${hourlyRate.toFixed(2)}` : <span className="text-white/30 text-2xl">Sin tarifa</span>}
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-[var(--color-brand-500)]/15 to-transparent">
          <div className="text-xs uppercase text-white/55 flex items-center gap-1.5"><DollarSign size={12} /> A cobrar este período</div>
          <div className="text-3xl font-extrabold mt-1 text-[var(--color-brand-400)]">
            {hourlyRate != null ? `$${earnings.toFixed(2)}` : "—"}
          </div>
          <div className="text-xs text-white/45 mt-1">estimado bruto</div>
        </div>
      </div>

      {/* Period quick-select pills */}
      <div className="flex gap-2 flex-wrap">
        {ALL_PERIODS.slice(0, 6).map((p, i) => (
          <button
            key={p.key}
            onClick={() => setPeriodIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              i === periodIdx
                ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950)] border-transparent"
                : p.isCurrent
                ? "border-[var(--color-brand-500)]/40 text-[var(--color-brand-400)] hover:border-[var(--color-brand-500)]"
                : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"
            }`}
          >
            {p.isCurrent ? "✦ " : ""}{p.label}
          </button>
        ))}
      </div>

      {/* Entries table */}
      <section className="card p-6">
        <h2 className="font-semibold text-lg mb-4">Detalle de horas</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/55">
            <Loader2 className="animate-spin mr-2" size={18} /> Cargando…
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead className="text-left text-white/55 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Tarea</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Nota</th>
                  <th className="px-6 py-3 text-right">Horas</th>
                  {hourlyRate != null && <th className="px-6 py-3 text-right">Monto</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-white/5">
                    <td className="px-6 py-3 text-white/70">
                      {new Date(e.date).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3 font-medium">{e.task?.title ?? "—"}</td>
                    <td className="px-6 py-3 text-white/55 hidden sm:table-cell">{e.note ?? "—"}</td>
                    <td className="px-6 py-3 text-right font-bold text-[var(--color-brand-400)]">{e.hours.toFixed(1)}h</td>
                    {hourlyRate != null && (
                      <td className="px-6 py-3 text-right text-white/70">${(e.hours * hourlyRate).toFixed(2)}</td>
                    )}
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-white/45">
                      Sin registros para este período.
                    </td>
                  </tr>
                )}
              </tbody>
              {entries.length > 0 && (
                <tfoot className="border-t border-white/10 font-bold">
                  <tr>
                    <td colSpan={hourlyRate != null ? 3 : 2} className="px-6 py-3 text-white/55 text-xs uppercase">Total</td>
                    <td className="px-6 py-3 text-right text-[var(--color-brand-400)]">{totalHours.toFixed(1)}h</td>
                    {hourlyRate != null && (
                      <td className="px-6 py-3 text-right text-white">${earnings.toFixed(2)}</td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
