"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Clock, ChevronLeft, ChevronRight, Download, DollarSign, Users } from "lucide-react";
import { listRecentPeriods, currentPeriod, DEFAULT_ANCHOR, localISODate } from "@/lib/pay-periods";

type UserInfo = { id: string; name: string | null; email: string; hourlyRate: number | null };
type TaskInfo = { id: string; title: string; order: { id: string; number: string } | null } | null;

type Entry = {
  id: string;
  userId: string;
  hours: number;
  note: string | null;
  date: string;
  user: UserInfo;
  task: TaskInfo;
};

type Period = { key: string; label: string; start: string; end: string; isCurrent: boolean };

// Build periods client-side from the anchor
const PERIODS: Period[] = listRecentPeriods(DEFAULT_ANCHOR, 12).map((p) => ({
  key: p.key,
  label: p.label,
  start: localISODate(p.start),
  end: localISODate(p.end),
  isCurrent: p.isCurrent,
}));

const CURRENT_KEY = currentPeriod(DEFAULT_ANCHOR).key;

function toDateInput(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return localISODate(dt);
}

function formatPayday(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/55 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function AdminHorasPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [employees, setEmployees] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodIdx, setPeriodIdx] = useState(0); // 0 = most recent period
  const [filterUser, setFilterUser] = useState("");
  const [modal, setModal] = useState<Partial<Entry> & { _new?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedPeriod = PERIODS[periodIdx];

  const load = useCallback(async (period: Period) => {
    setLoading(true);
    const r = await fetch(`/api/horas?from=${period.start}&to=${period.end}`);
    const data: Entry[] = await r.json();
    setEntries(data);
    setLoading(false);
  }, []);

  // Load full employee list so the add-entry modal always has options
  useEffect(() => {
    fetch("/api/empleados")
      .then((r) => r.json())
      .then((data: UserInfo[]) => {
        if (Array.isArray(data))
          setEmployees(data.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(selectedPeriod); }, [selectedPeriod, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => (filterUser ? entries.filter((e) => e.userId === filterUser) : entries),
    [entries, filterUser]
  );

  const totalHours = useMemo(() => filtered.reduce((s, e) => s + e.hours, 0), [filtered]);
  const totalPayroll = useMemo(
    () => filtered.reduce((s, e) => s + e.hours * (e.user.hourlyRate ?? 0), 0),
    [filtered]
  );

  // Per-employee breakdown (uses all entries, not filtered)
  const perEmployee = useMemo(() => {
    const map = new Map<string, { user: UserInfo; hours: number; gross: number }>();
    for (const e of entries) {
      const ex = map.get(e.userId) ?? { user: e.user, hours: 0, gross: 0 };
      ex.hours += e.hours;
      ex.gross += e.hours * (e.user.hourlyRate ?? 0);
      map.set(e.userId, ex);
    }
    return [...map.values()].sort((a, b) => b.hours - a.hours);
  }, [entries]);

  function exportCSV() {
    const rows: string[][] = [["Período", "Empleado", "Tarifa/hr", "Fecha", "Horas", "Costo", "Tarea", "Orden", "Nota"]];
    for (const e of filtered) {
      rows.push([
        selectedPeriod.label,
        e.user.name ?? e.user.email,
        e.user.hourlyRate != null ? `$${e.user.hourlyRate.toFixed(2)}` : "",
        new Date(e.date).toLocaleDateString("es-PR"),
        e.hours.toFixed(2),
        e.user.hourlyRate != null ? `$${(e.hours * e.user.hourlyRate).toFixed(2)}` : "",
        e.task?.title ?? "",
        e.task?.order?.number ?? "",
        e.note ?? "",
      ]);
    }
    rows.push([]);
    rows.push(["RESUMEN POR EMPLEADO"]);
    rows.push(["Empleado", "Tarifa/hr", "Total Horas", "Total Bruto"]);
    for (const row of perEmployee) {
      rows.push([
        row.user.name ?? row.user.email,
        row.user.hourlyRate != null ? `$${row.user.hourlyRate.toFixed(2)}` : "—",
        row.hours.toFixed(2),
        `$${row.gross.toFixed(2)}`,
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomina-${selectedPeriod.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function save() {
    if (!modal) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        userId: modal.userId,
        hours: Number(modal.hours),
        note: modal.note ?? null,
        date: modal.date ? modal.date : new Date().toISOString(),
      };
      const res = modal._new
        ? await fetch("/api/horas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch(`/api/horas/${modal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al guardar"); return; }
      setModal(null);
      load(selectedPeriod);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este registro de horas?")) return;
    await fetch(`/api/horas/${id}`, { method: "DELETE" });
    load(selectedPeriod);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="heading-lg">Nómina bisemanal</h1>
          <p className="text-white/65 mt-1">Horas y pagos organizados por período de cobro.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-sm font-semibold hover:bg-white/5 transition"
          >
            <Download size={15} /> Exportar CSV
          </button>
          <button
            onClick={() => setModal({ _new: true, userId: employees[0]?.id ?? "", hours: 1, note: "", date: toDateInput(new Date()) })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] text-sm font-bold hover:brightness-110"
          >
            <Plus size={16} /> Registrar horas
          </button>
        </div>
      </header>

      {/* Pay period selector */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPeriodIdx((i) => Math.min(i + 1, PERIODS.length - 1))}
            disabled={periodIdx >= PERIODS.length - 1}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition"
            title="Período anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2 flex-wrap flex-1 justify-center">
            {PERIODS.slice(0, 6).map((p, i) => (
              <button
                key={p.key}
                onClick={() => { setPeriodIdx(i); setFilterUser(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  i === periodIdx
                    ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950)] border-transparent"
                    : p.isCurrent
                    ? "border-[var(--color-brand-500)]/50 text-[var(--color-brand-400)] hover:border-[var(--color-brand-500)]"
                    : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                }`}
              >
                {p.isCurrent ? "✦ " : ""}{p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPeriodIdx((i) => Math.max(i - 1, 0))}
            disabled={periodIdx === 0}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition"
            title="Período siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/55">
          <DollarSign size={14} className="text-emerald-400" />
          <span>
            Día de pago:{" "}
            <span className={`font-semibold ${selectedPeriod.key === CURRENT_KEY ? "text-emerald-400" : "text-white/80"}`}>
              {formatPayday(selectedPeriod.end)}
            </span>
            {selectedPeriod.isCurrent && (
              <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                período actual
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55 tracking-wider flex items-center gap-1.5"><Clock size={12} /> Total horas</div>
          <div className="text-3xl font-extrabold mt-1">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-white/45 mt-1">{filtered.length} registro(s)</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55 tracking-wider flex items-center gap-1.5"><Users size={12} /> Empleados</div>
          <div className="text-3xl font-extrabold mt-1">{perEmployee.length}</div>
          <div className="text-xs text-white/45 mt-1">este período</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-[var(--color-brand-500)]/15 to-transparent">
          <div className="text-xs uppercase text-white/55 tracking-wider flex items-center gap-1.5"><DollarSign size={12} /> Nómina total</div>
          <div className="text-3xl font-extrabold mt-1 text-[var(--color-brand-400)]">${totalPayroll.toFixed(2)}</div>
          <div className="text-xs text-white/45 mt-1">período seleccionado</div>
        </div>
      </div>

      {/* Per-employee breakdown */}
      {perEmployee.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 mb-3">
            Desglose — {selectedPeriod.label}
          </h3>
          <div className="grid gap-2">
            {perEmployee.map((row) => {
              const pct = totalHours > 0 ? (row.hours / totalHours) * 100 : 0;
              return (
                <button
                  key={row.user.id}
                  onClick={() => setFilterUser(row.user.id === filterUser ? "" : row.user.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                    filterUser === row.user.id
                      ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10"
                      : "border-white/8 hover:border-white/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{row.user.name ?? row.user.email}</div>
                    <div className="text-xs text-white/45 mt-0.5">
                      {row.user.hourlyRate != null ? `$${row.user.hourlyRate.toFixed(2)}/hr` : "Sin tarifa"}
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-brand-500)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[var(--color-brand-400)]">{row.hours.toFixed(1)}h</div>
                    <div className="text-sm font-semibold text-white mt-0.5">${row.gross.toFixed(2)}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {filterUser && (
            <button onClick={() => setFilterUser("")} className="mt-2 text-xs text-white/45 hover:text-white flex items-center gap-1">
              <X size={12} /> Mostrar todos
            </button>
          )}
        </div>
      )}

      {/* Detail table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/65">Registros del período</h3>
          {employees.length > 1 && (
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="select text-sm py-1.5 px-3">
              <option value="">Todos los empleados</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name ?? emp.email}</option>
              ))}
            </select>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/55">
            <Loader2 className="animate-spin mr-2" size={18} /> Cargando...
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-widest text-white/45">
                <tr>
                  <th className="text-left px-2 py-2">Empleado</th>
                  <th className="text-left px-2 py-2">Fecha</th>
                  <th className="text-left px-2 py-2 hidden md:table-cell">Tarea</th>
                  <th className="text-left px-2 py-2 hidden md:table-cell">Orden</th>
                  <th className="text-left px-2 py-2 hidden lg:table-cell">Nota</th>
                  <th className="text-right px-2 py-2">Horas</th>
                  <th className="text-right px-2 py-2 hidden sm:table-cell">Costo</th>
                  <th className="text-right px-2 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/3">
                    <td className="px-2 py-2 font-semibold text-white">{e.user.name ?? e.user.email}</td>
                    <td className="px-2 py-2 text-white/70">
                      {new Date(e.date).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-2 py-2 text-white/70 hidden md:table-cell max-w-[180px] truncate">{e.task?.title ?? "—"}</td>
                    <td className="px-2 py-2 text-white/60 hidden md:table-cell">{e.task?.order?.number ?? "—"}</td>
                    <td className="px-2 py-2 text-white/55 hidden lg:table-cell max-w-[200px] truncate">{e.note ?? "—"}</td>
                    <td className="px-2 py-2 text-right font-bold text-[var(--color-brand-400)] tabular-nums">{e.hours.toFixed(1)}h</td>
                    <td className="px-2 py-2 text-right text-white/55 tabular-nums hidden sm:table-cell">
                      {e.user.hourlyRate != null ? `$${(e.hours * e.user.hourlyRate).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button onClick={() => setModal({ ...e })} className="p-1.5 rounded hover:bg-white/10 text-white/65 hover:text-white" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(e.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-300" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-white/55">Sin registros en este período de pago.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal — create / edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-lg">{modal._new ? "Registrar horas" : "Editar registro"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded hover:bg-white/10 text-white/65"><X size={18} /></button>
            </div>

            <Field label="Empleado">
              <select
                value={modal.userId ?? ""}
                onChange={(e) => setModal((m) => m ? { ...m, userId: e.target.value } : m)}
                className="select w-full"
                disabled={!modal._new}
              >
                <option value="">Seleccionar…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name ?? emp.email}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input
                  type="date"
                  value={modal.date ? toDateInput(modal.date) : toDateInput(new Date())}
                  onChange={(e) => setModal((m) => m ? { ...m, date: e.target.value } : m)}
                  className="input w-full"
                  min={selectedPeriod.start}
                  max={selectedPeriod.end}
                />
              </Field>
              <Field label="Horas">
                <input
                  type="number" min="0.25" step="0.25"
                  value={modal.hours ?? ""}
                  onChange={(e) => setModal((m) => m ? { ...m, hours: parseFloat(e.target.value) } : m)}
                  className="input w-full" placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Nota (opcional)">
              <input
                type="text" value={modal.note ?? ""}
                onChange={(e) => setModal((m) => m ? { ...m, note: e.target.value } : m)}
                className="input w-full" placeholder="Descripción del trabajo…"
              />
            </Field>

            <p className="text-xs text-white/40">
              Período: <span className="text-white/65">{selectedPeriod.label} · Pago: {formatPayday(selectedPeriod.end)}</span>
            </p>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancelar</button>
              <button onClick={save} disabled={saving || !modal.userId || !modal.hours} className="btn btn-primary flex-1">
                {saving ? <Loader2 className="animate-spin" size={16} /> : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
