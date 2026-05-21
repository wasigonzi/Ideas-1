"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Clock } from "lucide-react";

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

const DAYS_OPTIONS = [
  { label: "Últimos 30 días", value: 30 },
  { label: "Últimos 60 días", value: 60 },
  { label: "Últimos 90 días", value: 90 },
  { label: "Últimos 6 meses", value: 180 },
];

function toDateInput(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const [days, setDays] = useState(90);
  const [filterUser, setFilterUser] = useState("");
  const [modal, setModal] = useState<Partial<Entry> & { _new?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(d = days) {
    setLoading(true);
    const r = await fetch(`/api/horas?days=${d}`);
    const data: Entry[] = await r.json();
    setEntries(data);
    // Extract unique employees from entries
    const map = new Map<string, UserInfo>();
    for (const e of data) map.set(e.user.id, e.user);
    setEmployees([...map.values()].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => (filterUser ? entries.filter((e) => e.userId === filterUser) : entries),
    [entries, filterUser]
  );

  const totalHours = useMemo(() => filtered.reduce((s, e) => s + e.hours, 0), [filtered]);
  const totalPayroll = useMemo(
    () => filtered.reduce((s, e) => s + e.hours * (e.user.hourlyRate ?? 0), 0),
    [filtered]
  );

  // Per-employee summary
  const perEmployee = useMemo(() => {
    const map = new Map<string, { user: UserInfo; hours: number; count: number }>();
    for (const e of filtered) {
      const existing = map.get(e.userId) ?? { user: e.user, hours: 0, count: 0 };
      existing.hours += e.hours;
      existing.count += 1;
      map.set(e.userId, existing);
    }
    return [...map.values()].sort((a, b) => b.hours - a.hours);
  }, [filtered]);

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
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este registro de horas?")) return;
    await fetch(`/api/horas/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="heading-lg">Horas registradas</h1>
          <p className="text-white/65 mt-1">Gestiona el tiempo trabajado de todos los empleados.</p>
        </div>
        <button
          onClick={() => setModal({ _new: true, userId: employees[0]?.id ?? "", hours: 1, note: "", date: toDateInput(new Date()) })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] text-sm font-bold hover:brightness-110"
        >
          <Plus size={16} /> Registrar horas
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="select text-sm py-1.5 px-3"
        >
          <option value="">Todos los empleados</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name ?? emp.email}</option>
          ))}
        </select>
        <select
          value={days}
          onChange={(e) => { setDays(Number(e.target.value)); load(Number(e.target.value)); }}
          className="select text-sm py-1.5 px-3"
        >
          {DAYS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55 tracking-wider">Total horas</div>
          <div className="text-3xl font-extrabold mt-1">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-white/45 mt-1">{filtered.length} registro(s)</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55 tracking-wider">Empleados</div>
          <div className="text-3xl font-extrabold mt-1">{perEmployee.length}</div>
          <div className="text-xs text-white/45 mt-1">con registros</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-[var(--color-brand-500)]/15 to-transparent">
          <div className="text-xs uppercase text-white/55 tracking-wider">Nómina estimada</div>
          <div className="text-3xl font-extrabold mt-1 text-[var(--color-brand-400)]">${totalPayroll.toFixed(2)}</div>
          <div className="text-xs text-white/45 mt-1">según tarifa por hora</div>
        </div>
      </div>

      {/* Per-employee summary */}
      {perEmployee.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 mb-3">Resumen por empleado</h3>
          <div className="flex flex-wrap gap-3">
            {perEmployee.map((row) => (
              <button
                key={row.user.id}
                onClick={() => setFilterUser(row.user.id === filterUser ? "" : row.user.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                  filterUser === row.user.id
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 text-white"
                    : "border-white/10 hover:border-white/25 text-white/75"
                }`}
              >
                <Clock size={13} className="text-[var(--color-brand-400)]" />
                <span className="font-semibold">{row.user.name ?? row.user.email}</span>
                <span className="text-[var(--color-brand-400)] font-bold">{row.hours.toFixed(1)}h</span>
                {row.user.hourlyRate != null && (
                  <span className="text-white/45 text-xs">${(row.hours * row.user.hourlyRate).toFixed(2)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 mb-4">Detalle</h3>
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
                    <td className="px-2 py-2 text-white/70 hidden md:table-cell max-w-[180px] truncate">
                      {e.task?.title ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-white/60 hidden md:table-cell">
                      {e.task?.order?.number ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-white/55 hidden lg:table-cell max-w-[200px] truncate">
                      {e.note ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-[var(--color-brand-400)] tabular-nums">
                      {e.hours.toFixed(1)}h
                    </td>
                    <td className="px-2 py-2 text-right text-white/55 tabular-nums hidden sm:table-cell">
                      {e.user.hourlyRate != null ? `$${(e.hours * e.user.hourlyRate).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => setModal({ ...e })}
                        className="p-1.5 rounded hover:bg-white/10 text-white/65 hover:text-white"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(e.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-white/55">
                      Sin registros en el período seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-lg">{modal._new ? "Registrar horas" : "Editar registro"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded hover:bg-white/10 text-white/65">
                <X size={18} />
              </button>
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
                />
              </Field>
              <Field label="Horas">
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={modal.hours ?? ""}
                  onChange={(e) => setModal((m) => m ? { ...m, hours: parseFloat(e.target.value) } : m)}
                  className="input w-full"
                  placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Nota (opcional)">
              <input
                type="text"
                value={modal.note ?? ""}
                onChange={(e) => setModal((m) => m ? { ...m, note: e.target.value } : m)}
                className="input w-full"
                placeholder="Descripción del trabajo…"
              />
            </Field>

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
