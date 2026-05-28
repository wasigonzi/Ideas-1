"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Clock, Calendar, Coffee, Download, ChevronDown } from "lucide-react";

type Employee = { id: string; name: string | null; email: string; role: string };
type Shift = {
  id: string;
  userId: string;
  dayOfWeek: number;
  start: string;
  end: string;
  label: string | null;
  active: boolean;
};
type PunchBreak = { id: string; start: string; end: string | null };
type BreakEdit = { id: string; start: string; end: string | null };
type Punch = {
  id: string;
  userId: string;
  userName: string;
  in: string;
  out: string | null;
  hours: number | null;
  note: string | null;
  source: string;
  breaks: PunchBreak[];
};

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function HorariosManager({
  employees,
  shifts,
  punches
}: {
  employees: Employee[];
  shifts: Shift[];
  punches: Punch[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"horario" | "ponches">("horario");
  const [shiftEditor, setShiftEditor] = useState<Partial<Shift> | null>(null);
  const [punchEditor, setPunchEditor] = useState<Partial<Punch> & { _new?: boolean } | null>(null);
  const [breakEditor, setBreakEditor] = useState<BreakEdit | null>(null);
  const [addBreakPunchId, setAddBreakPunchId] = useState<string | null>(null);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // Filtered punches
  const filteredPunches = useMemo(() => {
    return punches.filter((p) => {
      if (filterEmployee && p.userId !== filterEmployee) return false;
      const inDate = new Date(p.in);
      if (filterFrom && inDate < new Date(filterFrom)) return false;
      if (filterTo && inDate > new Date(filterTo + "T23:59:59")) return false;
      return true;
    });
  }, [punches, filterEmployee, filterFrom, filterTo]);

  // Weekly summary (current Sun–Sat)
  const weeklySummary = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const byUser = new Map<string, { userName: string; hours: number; punchCount: number }>();
    for (const p of punches) {
      if (new Date(p.in) < weekStart) continue;
      const entry = byUser.get(p.userId) ?? { userName: p.userName, hours: 0, punchCount: 0 };
      entry.hours += p.hours ?? 0;
      entry.punchCount += 1;
      byUser.set(p.userId, entry);
    }
    return Array.from(byUser.values()).sort((a, b) => b.hours - a.hours);
  }, [punches]);

  function exportCSV() {
    const rows: string[][] = [["Empleado", "Fecha", "Entrada", "Salida", "Horas", "Origen", "Nota"]];
    for (const p of filteredPunches) {
      const inDate = new Date(p.in);
      const outDate = p.out ? new Date(p.out) : null;
      rows.push([
        p.userName,
        inDate.toLocaleDateString("es-PR"),
        inDate.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true }),
        outDate ? outDate.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true }) : "ABIERTO",
        p.hours != null ? p.hours.toFixed(2) : "",
        p.source,
        p.note ?? ""
      ]);
      for (const b of p.breaks) {
        const bStart = new Date(b.start);
        const bEnd = b.end ? new Date(b.end) : null;
        rows.push([
          `↳ ${p.userName} (descanso)`,
          bStart.toLocaleDateString("es-PR"),
          bStart.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true }),
          bEnd ? bEnd.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true }) : "ACTIVO",
          bEnd ? ((bEnd.getTime() - bStart.getTime()) / 3600000).toFixed(2) : "",
          "descanso",
          ""
        ]);
      }
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ponches-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Group shifts by user/day
  const grid = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const s of shifts) {
      const k = `${s.userId}:${s.dayOfWeek}`;
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    return m;
  }, [shifts]);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setTab("horario")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            tab === "horario"
              ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)]"
              : "text-white/65 hover:text-white"
          }`}
        >
          <Calendar size={14} className="inline -mt-0.5 mr-1.5" />
          Horario semanal
        </button>
        <button
          onClick={() => setTab("ponches")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            tab === "ponches"
              ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)]"
              : "text-white/65 hover:text-white"
          }`}
        >
          <Clock size={14} className="inline -mt-0.5 mr-1.5" />
          Ponches ({punches.length})
        </button>
      </div>

      {tab === "horario" && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[11px] uppercase tracking-widest text-white/55">
                <tr>
                  <th className="text-left px-4 py-3 sticky left-0 bg-[#0c1422] z-10 min-w-[180px]">
                    Empleado
                  </th>
                  {DAYS_SHORT.map((d, i) => (
                    <th key={i} className="text-left px-3 py-3 min-w-[140px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 align-top">
                    <td className="px-4 py-3 sticky left-0 bg-[#0c1422] z-10">
                      <div className="font-bold text-white">{e.name ?? e.email.split("@")[0]}</div>
                      <div className="text-[11px] text-white/45">{e.email}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--color-brand-400)] mt-0.5">
                        {e.role}
                      </div>
                    </td>
                    {DAYS_SHORT.map((_, dow) => {
                      const cellShifts = grid.get(`${e.id}:${dow}`) ?? [];
                      return (
                        <td key={dow} className="px-2 py-2">
                          <div className="space-y-1.5">
                            {cellShifts.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => setShiftEditor(s)}
                                className={`block w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold transition group ${
                                  s.active
                                    ? "bg-[var(--color-brand-500)]/20 text-[var(--color-brand-300)] hover:bg-[var(--color-brand-500)]/30 border border-[var(--color-brand-500)]/40"
                                    : "bg-white/5 text-white/40 line-through"
                                }`}
                              >
                                <div className="tabular-nums">
                                  {to12h(s.start)} – {to12h(s.end)}
                                </div>
                                {s.label && (
                                  <div className="text-[10px] font-normal opacity-70 truncate">
                                    {s.label}
                                  </div>
                                )}
                              </button>
                            ))}
                            <button
                              onClick={() =>
                                setShiftEditor({
                                  userId: e.id,
                                  dayOfWeek: dow,
                                  start: "08:00",
                                  end: "17:00",
                                  active: true
                                })
                              }
                              className="w-full flex items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-white/35 hover:text-white hover:border-white/30 px-2 py-1 text-xs"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-white/55">
                      No hay empleados activos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "ponches" && (
        <div className="card p-5">
          {/* ── Filtros + acciones ── */}
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/45 mb-1">Empleado</div>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="input text-sm py-1.5 min-w-[150px]"
              >
                <option value="">Todos</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name ?? e.email}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/45 mb-1">Desde</div>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="input text-sm py-1.5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/45 mb-1">Hasta</div>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="input text-sm py-1.5" />
            </div>
            <div className="ml-auto flex items-end gap-2 flex-wrap">
              {(filterEmployee || filterFrom || filterTo) && (
                <button
                  onClick={() => { setFilterEmployee(""); setFilterFrom(""); setFilterTo(""); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/55 hover:text-white hover:bg-white/10"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 text-white/75 text-xs font-bold hover:bg-white/15"
              >
                <Download size={13} /> Exportar CSV
              </button>
              <button
                onClick={() =>
                  setPunchEditor({
                    _new: true,
                    userId: employees[0]?.id ?? "",
                    in: toLocalInput(new Date()),
                    out: null
                  })
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] text-sm font-bold hover:brightness-110"
              >
                <Plus size={14} /> Registrar ponche
              </button>
            </div>
          </div>

          {/* ── Resumen semanal ── */}
          {weeklySummary.length > 0 && (
            <div className="mb-5">
              <button
                onClick={() => setShowSummary((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/45 hover:text-white/80 mb-2"
              >
                <ChevronDown size={13} className={`transition-transform ${showSummary ? "rotate-180" : ""}`} />
                Resumen semana actual
              </button>
              {showSummary && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {weeklySummary.map(({ userName, hours, punchCount }) => (
                    <div
                      key={userName}
                      className={`rounded-xl border p-3 ${
                        hours > 40
                          ? "border-red-500/40 bg-red-500/8"
                          : hours > 35
                          ? "border-amber-500/40 bg-amber-500/8"
                          : "border-white/10 bg-white/4"
                      }`}
                    >
                      <div className="font-bold text-sm text-white truncate">{userName}</div>
                      <div className={`text-2xl font-extrabold mt-1 ${
                        hours > 40 ? "text-red-400" : hours > 35 ? "text-amber-400" : "text-[var(--color-brand-400)]"
                      }`}>
                        {hours.toFixed(1)}h
                      </div>
                      <div className="text-[11px] text-white/45 mt-0.5">
                        {punchCount} ponche{punchCount !== 1 ? "s" : ""}
                        {hours > 40 && <span className="ml-2 text-red-400 font-bold">Overtime</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-widest text-white/45">
                <tr>
                  <th className="text-left px-2 py-2">Empleado</th>
                  <th className="text-left px-2 py-2">Fecha</th>
                  <th className="text-left px-2 py-2">Entrada</th>
                  <th className="text-left px-2 py-2">Salida</th>
                  <th className="text-right px-2 py-2">Horas</th>
                  <th className="text-left px-2 py-2 hidden md:table-cell">Origen</th>
                  <th className="text-left px-2 py-2 hidden lg:table-cell">Nota</th>
                  <th className="text-right px-2 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPunches.map((p) => {
                  const inDate = new Date(p.in);
                  const outDate = p.out ? new Date(p.out) : null;
                  return (
                    <React.Fragment key={p.id}>
                      <tr key={p.id} className="border-t border-white/5">
                        <td className="px-2 py-2 font-bold text-white">{p.userName}</td>
                        <td className="px-2 py-2 capitalize text-white/85">
                          {inDate.toLocaleDateString("es-PR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short"
                          })}
                        </td>
                        <td className="px-2 py-2 tabular-nums">
                          {inDate.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </td>
                        <td className="px-2 py-2 tabular-nums">
                          {outDate
                            ? outDate.toLocaleTimeString("es-PR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })
                            : <span className="text-emerald-400 text-xs font-bold uppercase">abierto</span>}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums font-bold">
                          {p.hours != null ? `${p.hours.toFixed(2)}h` : "—"}
                        </td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                              p.source === "auto"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : p.source === "admin"
                                ? "bg-purple-500/15 text-purple-300"
                                : "bg-white/10 text-white/65"
                            }`}
                          >
                            {p.source}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-white/55 hidden lg:table-cell max-w-[200px] truncate">
                          {p.note ?? "—"}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => setAddBreakPunchId(p.id)}
                            className="p-1.5 rounded hover:bg-amber-500/20 text-amber-300"
                            title="Agregar descanso"
                          >
                            <Coffee size={14} />
                          </button>
                          <button
                            onClick={() => setPunchEditor(p)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/65 hover:text-white"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("¿Eliminar este ponche?")) return;
                              const res = await fetch(`/api/ponche/${p.id}`, { method: "DELETE" });
                              if (!res.ok) { alert("No se pudo eliminar el ponche. Intenta de nuevo."); return; }
                              router.refresh();
                            }}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {p.breaks.map((b) => {
                        const bStart = new Date(b.start);
                        const bEnd = b.end ? new Date(b.end) : null;
                        const bHours = bEnd ? (bEnd.getTime() - bStart.getTime()) / 3600000 : null;
                        return (
                          <tr key={b.id} className="border-t border-white/3 bg-amber-500/5">
                            <td className="px-2 py-1.5 pl-5 text-amber-400 text-xs font-semibold">↳ descanso</td>
                            <td className="px-2 py-1.5 text-white/45 text-xs">
                              {bStart.toLocaleDateString("es-PR", { weekday: "short", day: "numeric", month: "short" })}
                            </td>
                            <td className="px-2 py-1.5 tabular-nums text-xs text-white/65">
                              {bStart.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </td>
                            <td className="px-2 py-1.5 tabular-nums text-xs text-white/65">
                              {bEnd
                                ? bEnd.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit", hour12: true })
                                : <span className="text-amber-400 text-xs font-bold uppercase">activo</span>}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-xs text-white/65">
                              {bHours != null ? `${bHours.toFixed(2)}h` : "—"}
                            </td>
                            <td className="px-2 py-1.5 hidden md:table-cell">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-amber-500/15 text-amber-300">
                                descanso
                              </span>
                            </td>
                            <td className="px-2 py-1.5 hidden lg:table-cell text-white/30 text-xs">—</td>
                            <td className="px-2 py-1.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => setBreakEditor({ id: b.id, start: b.start, end: b.end })}
                                className="p-1.5 rounded hover:bg-white/10 text-white/65 hover:text-white"
                                title="Editar descanso"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm("¿Eliminar este descanso?")) return;
                                  const res = await fetch(`/api/ponche/break/${b.id}`, { method: "DELETE" });
                                  if (!res.ok) { alert("No se pudo eliminar el descanso. Intenta de nuevo."); return; }
                                  router.refresh();
                                }}
                                className="p-1.5 rounded hover:bg-red-500/20 text-red-300"
                                title="Eliminar descanso"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {filteredPunches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-white/55">
                      Sin ponches en los últimos 14 días.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BREAK MODAL */}
      <AnimatePresence>
        {addBreakPunchId && (
          <AddBreakModal
            punchId={addBreakPunchId}
            onClose={() => setAddBreakPunchId(null)}
            onSaved={() => {
              setAddBreakPunchId(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* BREAK EDITOR MODAL */}
      <AnimatePresence>
        {breakEditor && (
          <BreakEditorModal
            breakRecord={breakEditor}
            onClose={() => setBreakEditor(null)}
            onSaved={() => {
              setBreakEditor(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* SHIFT EDITOR MODAL */}
      <AnimatePresence>
        {shiftEditor && (
          <ShiftEditorModal
            employees={employees}
            shift={shiftEditor}
            onClose={() => setShiftEditor(null)}
            onSaved={() => {
              setShiftEditor(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* PUNCH EDITOR MODAL */}
      <AnimatePresence>
        {punchEditor && (
          <PunchEditorModal
            employees={employees}
            punch={punchEditor}
            onClose={() => setPunchEditor(null)}
            onSaved={() => {
              setPunchEditor(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ----------------- SHIFT EDITOR ----------------- */

function ShiftEditorModal({
  employees,
  shift,
  onClose,
  onSaved
}: {
  employees: Employee[];
  shift: Partial<Shift>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [userId, setUserId] = useState(shift.userId ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(shift.dayOfWeek ?? 1);
  const [start, setStart] = useState(shift.start ?? "08:00");
  const [end, setEnd] = useState(shift.end ?? "17:00");
  const [label, setLabel] = useState(shift.label ?? "");
  const [active, setActive] = useState(shift.active ?? true);
  const [busy, setBusy] = useState(false);

  const isEdit = !!shift.id;

  async function save() {
    setBusy(true);
    try {
      const body = { userId, dayOfWeek, start, end, label: label || null, active };
      if (isEdit) {
        await fetch(`/api/horarios/${shift.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } else {
        await fetch("/api/horarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!shift.id) return;
    if (!confirm("¿Eliminar este turno?")) return;
    setBusy(true);
    await fetch(`/api/horarios/${shift.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <ModalShell onClose={onClose} title={isEdit ? "Editar turno" : "Nuevo turno"}>
      <div className="space-y-4">
        <Field label="Empleado">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input"
          >
            <option value="">— seleccionar —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name ?? e.email}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Día">
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
            className="input"
          >
            {DAYS_LONG.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Entrada">
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Salida">
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Etiqueta (opcional)">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej. Turno regular"
            className="input"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-white/85">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="accent-[var(--color-brand-500)]"
          />
          Turno activo
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 pt-5">
        {isEdit ? (
          <button
            onClick={remove}
            disabled={busy}
            className="text-red-300 hover:text-red-200 text-sm font-bold inline-flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button onClick={save} disabled={busy || !userId} className="btn-primary">
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ----------------- PUNCH EDITOR ----------------- */

function PunchEditorModal({
  employees,
  punch,
  onClose,
  onSaved
}: {
  employees: Employee[];
  punch: Partial<Punch> & { _new?: boolean };
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !!punch._new;
  const [userId, setUserId] = useState(punch.userId ?? "");
  const [inVal, setInVal] = useState(punch.in ? toLocalInput(new Date(punch.in)) : toLocalInput(new Date()));
  const [outVal, setOutVal] = useState(punch.out ? toLocalInput(new Date(punch.out)) : "");
  const [note, setNote] = useState(punch.note ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        in: new Date(inVal).toISOString(),
        out: outVal ? new Date(outVal).toISOString() : null,
        note: note || null
      };
      if (isNew) {
        body.userId = userId;
        await fetch("/api/ponche/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } else {
        await fetch(`/api/ponche/${punch.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title={isNew ? "Registrar ponche" : "Editar ponche"}>
      <div className="space-y-4">
        {isNew ? (
          <Field label="Empleado">
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="input">
              <option value="">— seleccionar —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name ?? e.email}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Empleado">
            <div className="input bg-white/5 cursor-not-allowed">{punch.userName}</div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Entrada">
            <input
              type="datetime-local"
              value={inVal}
              onChange={(e) => setInVal(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Salida (vacío = abierto)">
            <input
              type="datetime-local"
              value={outVal}
              onChange={(e) => setOutVal(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Nota">
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-5">
        <button onClick={onClose} className="btn-ghost">
          Cancelar
        </button>
        <button onClick={save} disabled={busy || (isNew && !userId)} className="btn-primary">
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ----------------- ADD BREAK MODAL ----------------- */

function AddBreakModal({
  punchId,
  onClose,
  onSaved
}: {
  punchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const now = new Date();
  const [startVal, setStartVal] = useState(toLocalInput(now));
  const [endVal, setEndVal] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/ponche/${punchId}/break`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: new Date(startVal).toISOString(),
          end: endVal ? new Date(endVal).toISOString() : null
        })
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Registrar descanso">
      <div className="space-y-4">
        <p className="text-sm text-white/55">
          Registra un período de descanso olvidado para este ponche.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio del descanso">
            <input
              type="datetime-local"
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Fin del descanso (vacío = activo)">
            <input
              type="datetime-local"
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Guardando…" : "Guardar descanso"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ----------------- BREAK EDITOR MODAL ----------------- */

function BreakEditorModal({
  breakRecord,
  onClose,
  onSaved
}: {
  breakRecord: BreakEdit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [startVal, setStartVal] = useState(toLocalInput(new Date(breakRecord.start)));
  const [endVal, setEndVal] = useState(breakRecord.end ? toLocalInput(new Date(breakRecord.end)) : "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/ponche/break/${breakRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: new Date(startVal).toISOString(),
          end: endVal ? new Date(endVal).toISOString() : null
        })
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Editar descanso">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio del descanso">
            <input
              type="datetime-local"
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Fin del descanso (vacío = activo)">
            <input
              type="datetime-local"
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ----------------- SHARED UI BITS ----------------- */

function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="card p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto relative"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-white/65">
            <X size={18} />
          </button>
        </div>
        {children}

        <style jsx>{`
          :global(.input) {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 14px;
            color: white;
            color-scheme: dark;
          }
          :global(.input:focus) {
            outline: none;
            border-color: var(--color-brand-500);
          }
          :global(.btn-primary) {
            background: var(--color-brand-500);
            color: var(--color-ink-950, #060b14);
            font-weight: 800;
            padding: 9px 16px;
            border-radius: 8px;
            font-size: 14px;
          }
          :global(.btn-primary:hover) {
            filter: brightness(1.1);
          }
          :global(.btn-primary:disabled) {
            opacity: 0.5;
            cursor: not-allowed;
          }
          :global(.btn-ghost) {
            color: rgba(255, 255, 255, 0.65);
            padding: 9px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
          }
          :global(.btn-ghost:hover) {
            background: rgba(255, 255, 255, 0.05);
            color: white;
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-white/55 font-bold mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
