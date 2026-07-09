"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Save, Trash2, ChevronLeft, ChevronRight, ClipboardList, ClipboardCheck } from "lucide-react";

type Employee = { id: string; name: string | null; email: string; avatar: string | null };
type Note = { id: string; userId: string; content: string; date: string; user: Employee };

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = toDateInput(new Date());
  const tomorrow = shiftDate(today, 1);
  const yesterday = shiftDate(today, -1);
  if (dateStr === today) return "Hoy";
  if (dateStr === tomorrow) return "Mañana";
  if (dateStr === yesterday) return "Ayer";
  return d.toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });
}

export default function AdminInstruccionesPage() {
  const [date, setDate] = useState(toDateInput(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notes, setNotes] = useState<Map<string, Note>>(new Map());
  const [drafts, setDrafts] = useState<Map<string, string>>(new Map());
  const [workReports, setWorkReports] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load employees once
  useEffect(() => {
    fetch("/api/empleados")
      .then((r) => r.json())
      .then((data: Employee[]) => setEmployees(data.filter((e) => (e as unknown as { role: string }).role !== "client")));
  }, []);

  // Load notes and work reports whenever date changes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/instrucciones?date=${date}`).then((r) => r.json()),
      fetch(`/api/trabajos?date=${date}`).then((r) => r.json())
    ])
      .then(([notesData, reportsData]: [Note[], any[]]) => {
        const notesMap = new Map<string, Note>();
        for (const n of notesData) notesMap.set(n.userId, n);
        setNotes(notesMap);

        // Sync drafts to loaded notes
        setDrafts((prev) => {
          const next = new Map(prev);
          for (const emp of employees) {
            next.set(emp.id, notesMap.get(emp.id)?.content ?? "");
          }
          return next;
        });

        // Set work reports map
        const reportsMap = new Map<string, string>();
        for (const report of reportsData) {
          reportsMap.set(report.userId, report.content);
        }
        setWorkReports(reportsMap);
      })
      .catch((err) => {
        console.error("Error loading daily data", err);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, employees]);

  // Clear pending auto-save timers on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t);
      timers.current.clear();
    };
  }, []);

  async function saveNote(userId: string, content: string) {
    setSaving((s) => new Set(s).add(userId));
    try {
      const res = await fetch("/api/instrucciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, content }),
      });
      const note: Note = await res.json();
      setNotes((prev) => new Map(prev).set(userId, note));
    } finally {
      setSaving((s) => { const n = new Set(s); n.delete(userId); return n; });
    }
  }

  async function deleteNote(userId: string) {
    const note = notes.get(userId);
    if (!note) return;
    await fetch(`/api/instrucciones/${note.id}`, { method: "DELETE" });
    setNotes((prev) => { const n = new Map(prev); n.delete(userId); return n; });
    setDrafts((prev) => new Map(prev).set(userId, ""));
  }

  function handleChange(userId: string, value: string) {
    setDrafts((prev) => new Map(prev).set(userId, value));
    // Auto-save after 1.5s idle
    const existing = timers.current.get(userId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      if (value.trim()) saveNote(userId, value);
      else if (notes.get(userId)) deleteNote(userId);
      timers.current.delete(userId);
    }, 1500);
    timers.current.set(userId, t);
  }

  const isDirty = (userId: string) => {
    const saved = notes.get(userId)?.content ?? "";
    return (drafts.get(userId) ?? "") !== saved;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Instrucciones diarias</h1>
        <p className="text-white/65 mt-1">Escribe instrucciones o notas para cada empleado por día.</p>
      </header>

      {/* Date navigator */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="p-2 rounded-lg hover:bg-white/10 text-white/65 hover:text-white transition"
        >
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto px-4 py-2 text-sm"
        />
        <span className="text-white/55 text-sm capitalize min-w-[80px]">{formatDateLabel(date)}</span>
        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          className="p-2 rounded-lg hover:bg-white/10 text-white/65 hover:text-white transition"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setDate(toDateInput(new Date()))}
          className="ml-1 px-3 py-1.5 rounded-lg bg-white/8 text-white/65 hover:text-white text-xs font-semibold transition"
        >
          Hoy
        </button>
      </div>

      {/* Employee cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/55">
          <Loader2 className="animate-spin mr-2" size={18} /> Cargando…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const draft = drafts.get(emp.id) ?? "";
            const hasNote = !!notes.get(emp.id);
            const dirty = isDirty(emp.id);
            const isSaving = saving.has(emp.id);
            const initials = (emp.name ?? emp.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div
                key={emp.id}
                className={`card p-5 flex flex-col gap-3 transition-all ${
                  hasNote ? "ring-1 ring-[var(--color-brand-500)]/30" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-brand-500)]/20 text-[var(--color-brand-400)] font-bold text-sm grid place-items-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{emp.name ?? emp.email}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isSaving && <Loader2 size={14} className="animate-spin text-white/40" />}
                    {!isSaving && dirty && (
                      <button
                        onClick={() => saveNote(emp.id, draft)}
                        className="p-1.5 rounded hover:bg-[var(--color-brand-500)]/20 text-[var(--color-brand-400)]"
                        title="Guardar"
                      >
                        <Save size={14} />
                      </button>
                    )}
                    {hasNote && !dirty && (
                      <button
                        onClick={() => deleteNote(emp.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                        title="Borrar instrucción"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={draft}
                  onChange={(e) => handleChange(emp.id, e.target.value)}
                  placeholder="Escribe instrucciones para este empleado…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-brand-500)]/60 resize-none"
                />

                {/* Status */}
                <div className="flex items-center gap-1.5 text-xs text-white/35">
                  {hasNote && !dirty ? (
                    <><ClipboardList size={11} /> Guardado</>
                  ) : dirty ? (
                    <span className="text-amber-400/70">Sin guardar — se guarda solo al dejar de escribir</span>
                  ) : (
                    <span>Sin instrucciones para este día</span>
                  )}
                </div>

                {/* Reporte de trabajo del empleado */}
                <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-400)] flex items-center gap-1.5">
                    <ClipboardCheck size={11} /> Trabajos del día
                  </div>
                  <div className="bg-white/3 border border-white/5 rounded-xl p-2.5 text-xs text-white/80 whitespace-pre-wrap max-h-[120px] overflow-y-auto custom-scrollbar">
                    {workReports.get(emp.id) || (
                      <span className="text-white/30 italic">Sin reporte de trabajo registrado.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {employees.length === 0 && (
            <p className="col-span-3 text-center py-12 text-white/55">No hay empleados activos.</p>
          )}
        </div>
      )}
    </div>
  );
}
