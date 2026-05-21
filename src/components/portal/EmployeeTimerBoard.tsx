"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  CheckCircle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Timer,
  Loader2,
  TrendingUp,
} from "lucide-react";
import type { TaskCard } from "./TaskBoard";
import type { TaskColumnDTO } from "@/lib/task-columns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskWithTimer = TaskCard & {
  /** Total seconds already logged in ended WorkSessions for this task */
  loggedSeconds: number;
  /** Active work session (null if not currently being worked on) */
  activeSession: { id: string; startedAt: string } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(totalSecs: number) {
  if (totalSecs <= 0) return "0m";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function fmtTimer(totalSecs: number) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function priorityLabel(p: string) {
  const map: Record<string, { label: string; cls: string }> = {
    urgent: { label: "Urgente", cls: "text-red-400" },
    high:   { label: "Alta",    cls: "text-orange-400" },
    normal: { label: "Normal",  cls: "text-white/50" },
    low:    { label: "Baja",    cls: "text-white/30" },
  };
  return map[p] ?? map["normal"];
}

function dueDateLabel(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  const str = d.toLocaleDateString("es-PR", { month: "short", day: "numeric" });
  if (diffDays < 0)  return { str, cls: "text-red-400" };
  if (diffDays <= 2) return { str, cls: "text-orange-400" };
  return { str, cls: "text-white/45" };
}

// ─── TaskTimerCard ─────────────────────────────────────────────────────────────

function TaskTimerCard({
  task,
  columnLabel,
  onStart,
  onStop,
  loading,
}: {
  task: TaskWithTimer;
  columnLabel: string;
  onStart: (taskId: string) => void;
  onStop: (taskId: string, review: boolean) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When there's an active session, start a live timer
  useEffect(() => {
    if (task.activeSession) {
      const startMs = new Date(task.activeSession.startedAt).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [task.activeSession]);

  const isActive = !!task.activeSession;
  const totalSecs = task.loggedSeconds + (isActive ? elapsed : 0);
  const pri = priorityLabel(task.priority);
  const due = dueDateLabel(task.dueDate);

  const statusDot: Record<string, string> = {
    todo: "bg-amber-500",
    in_progress: "bg-violet-500",
    review: "bg-sky-500",
    blocked: "bg-rose-500",
    done: "bg-emerald-500",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? "border-[var(--color-brand-500)]/60 bg-[var(--color-brand-500)]/5 shadow-lg shadow-[var(--color-brand-500)]/10"
          : "border-white/8 bg-white/3 hover:bg-white/5"
      }`}
    >
      {/* Active timer banner */}
      {isActive && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-500)]/12 border-b border-[var(--color-brand-500)]/20">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-brand-400)] tracking-wide uppercase">
            Trabajando ahora
          </span>
          <span className="ml-auto font-mono text-[var(--color-brand-400)] text-sm font-bold tabular-nums">
            {fmtTimer(elapsed)}
          </span>
        </div>
      )}

      <div className="px-4 py-3">
        {/* Top row: status + priority + due */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[task.status] ?? "bg-white/20"}`} />
          <span className="text-[11px] text-white/45 uppercase tracking-wide">{columnLabel}</span>
          <span className={`text-[11px] ml-1 ${pri.cls}`}>{pri.label}</span>
          {due && (
            <span className={`flex items-center gap-1 text-[11px] ml-auto ${due.cls}`}>
              <Calendar size={10} />
              {due.str}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug mb-1">{task.title}</h3>

        {/* Description (collapsible) */}
        {task.description && (
          <div className="mb-2">
            <p
              className={`text-xs text-white/50 leading-relaxed ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {task.description}
            </p>
            {task.description.length > 120 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[10px] text-white/35 hover:text-white/60 mt-0.5"
              >
                {expanded ? (
                  <><ChevronUp size={10} /> Menos</>
                ) : (
                  <><ChevronDown size={10} /> Ver más</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Footer row: time + actions */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/6">
          {/* Total time */}
          <div className="flex items-center gap-1.5 text-xs text-white/45">
            <Clock size={12} />
            <span>{totalSecs > 0 ? fmtDuration(totalSecs) : "Sin tiempo"}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <Loader2 size={18} className="animate-spin text-white/40" />
            ) : task.status === "done" ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle size={13} />
                Completada
              </span>
            ) : task.status === "review" ? (
              <span className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                <AlertCircle size={13} />
                En revisión
              </span>
            ) : isActive ? (
              // Stop + submit for review
              <button
                onClick={() => onStop(task.id, true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-colors"
              >
                <CheckCircle size={13} />
                Para aprobación
              </button>
            ) : (
              // Start button
              <button
                onClick={() => onStart(task.id)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] border border-[var(--color-brand-500)]/30 hover:bg-[var(--color-brand-500)]/25 transition-colors"
              >
                <Play size={12} fill="currentColor" />
                Comenzar trabajo
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── EmployeeTimerBoard ───────────────────────────────────────────────────────

export function EmployeeTimerBoard({
  initialTasks,
  columns,
}: {
  initialTasks: TaskWithTimer[];
  columns: TaskColumnDTO[];
}) {
  const [tasks, setTasks] = useState<TaskWithTimer[]>(initialTasks);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Total seconds actively worked today (across all tasks)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activeTask = tasks.find((t) => t.activeSession !== null);

  // Start work on a task
  const startWork = useCallback(async (taskId: string) => {
    setLoading((s) => new Set(s).add(taskId));
    try {
      const r = await fetch(`/api/tareas/${taskId}/work-start`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) { alert(j.error ?? "Error al iniciar"); return; }
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              status: t.status === "todo" ? "in_progress" : t.status,
              activeSession: {
                id: j.session.id,
                startedAt: j.session.startedAt,
              },
            };
          }
          // End any other active session (the API ended it server-side)
          if (t.activeSession) return { ...t, activeSession: null };
          return t;
        })
      );
    } finally {
      setLoading((s) => { const n = new Set(s); n.delete(taskId); return n; });
    }
  }, []);

  // Stop work on a task
  const stopWork = useCallback(async (taskId: string, submitForReview: boolean) => {
    setLoading((s) => new Set(s).add(taskId));
    try {
      const r = await fetch(`/api/tareas/${taskId}/work-stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitForReview }),
      });
      const j = await r.json();
      if (!r.ok) { alert(j.error ?? "Error al detener"); return; }
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: j.newStatus ?? t.status,
            activeSession: null,
            loggedSeconds: t.loggedSeconds + (j.elapsedSeconds ?? 0),
          };
        })
      );
    } finally {
      setLoading((s) => { const n = new Set(s); n.delete(taskId); return n; });
    }
  }, []);

  // Group tasks by status column order
  const colMap = new Map(columns.map((c) => [c.key, c.label]));
  const orderedStatuses = columns.map((c) => c.key);

  const grouped: { col: TaskColumnDTO; items: TaskWithTimer[] }[] = columns
    .map((col) => ({
      col,
      items: tasks.filter((t) => t.status === col.key),
    }))
    .filter((g) => g.items.length > 0);

  // Tasks with no matching column (e.g. custom statuses)
  const knownStatuses = new Set(columns.map((c) => c.key));
  const orphaned = tasks.filter((t) => !knownStatuses.has(t.status));

  // Summary stats
  const totalLogged = tasks.reduce((s, t) => s + t.loggedSeconds, 0);
  const pendingCount = tasks.filter(
    (t) => t.status === "todo" || t.status === "in_progress"
  ).length;
  const reviewCount = tasks.filter((t) => t.status === "review").length;

  return (
    <div className="space-y-6">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-500)]/15 grid place-items-center">
            <Timer size={15} className="text-[var(--color-brand-400)]" />
          </div>
          <div>
            <p className="text-[11px] text-white/45 uppercase tracking-wide">Tiempo total</p>
            <p className="text-sm font-bold">{fmtDuration(totalLogged)}</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 grid place-items-center">
            <TrendingUp size={15} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[11px] text-white/45 uppercase tracking-wide">En proceso</p>
            <p className="text-sm font-bold">{pendingCount}</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 grid place-items-center">
            <AlertCircle size={15} className="text-sky-400" />
          </div>
          <div>
            <p className="text-[11px] text-white/45 uppercase tracking-wide">Para revisión</p>
            <p className="text-sm font-bold">{reviewCount}</p>
          </div>
        </div>
      </div>

      {/* ── Active session notice ── */}
      <AnimatePresence>
        {activeTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/25 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse shrink-0" />
            <span className="text-[var(--color-brand-400)] font-medium">Trabajando en:</span>
            <span className="text-white/80 truncate">{activeTask.title}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task groups ── */}
      {tasks.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-white/30">
          <CheckCircle size={32} />
          <p className="text-sm">No tienes tareas asignadas por ahora.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active task always first */}
          {activeTask && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-400)] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
                Ahora trabajando
              </h2>
              <TaskTimerCard
                task={activeTask}
                columnLabel={colMap.get(activeTask.status) ?? activeTask.status}
                onStart={startWork}
                onStop={stopWork}
                loading={loading.has(activeTask.id)}
              />
            </section>
          )}

          {grouped.map(({ col, items }) => {
            // Skip items that are already shown in "active" section
            const filtered = items.filter(
              (t) => !activeTask || t.id !== activeTask.id
            );
            if (filtered.length === 0) return null;

            const accentBg = col.accent ?? "bg-white/20";
            return (
              <section key={col.key}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${accentBg}`} />
                  {col.label}
                  <span className="font-normal text-white/30">({filtered.length})</span>
                </h2>
                <div className="space-y-3">
                  {filtered.map((task) => (
                    <TaskTimerCard
                      key={task.id}
                      task={task}
                      columnLabel={col.label}
                      onStart={startWork}
                      onStop={stopWork}
                      loading={loading.has(task.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Orphaned tasks (unknown status) */}
          {orphaned.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
                Otros
              </h2>
              <div className="space-y-3">
                {orphaned.map((task) => (
                  <TaskTimerCard
                    key={task.id}
                    task={task}
                    columnLabel={task.status}
                    onStart={startWork}
                    onStop={stopWork}
                    loading={loading.has(task.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
