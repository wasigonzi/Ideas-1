"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Trophy,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useRealtimeRefresh } from "@/lib/realtime";

type TaskQuest = {
  id: string;
  title: string;
  status: string;
  priority: string;
  hours: number;
  dueDate: string | null;
  activeSession: { id: string; startedAt: string } | null;
};

type LoggedTask = {
  id: string;
  hours: number;
  note: string | null;
  taskTitle: string;
};

type APIResponse = {
  open: unknown;
  openBreak: unknown;
  today: { date: string; hours: number; count: number };
  week: { hours: number };
  tasks: TaskQuest[];
  todayTimeEntries: LoggedTask[];
  todayTaskHours: number;
};

function formatTimer(totalSecs: number) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function DailyQuestsBoard() {
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ponche", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscription
  useRealtimeRefresh({
    channelName: "portal-quests-board",
    tables: ["Punch", "PunchBreak", "Shift", "TimeEntry", "Task", "WorkSession"],
    fallbackMs: 20000,
    onChange: refresh,
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live timer for active task
  useEffect(() => {
    const activeTask = data?.tasks.find((t) => t.activeSession !== null);
    if (activeTask && activeTask.activeSession) {
      const startedAtMs = new Date(activeTask.activeSession.startedAt).getTime();
      const tick = () => {
        const diffSecs = Math.floor((Date.now() - startedAtMs) / 1000);
        setElapsedMap((prev) => ({ ...prev, [activeTask.id]: diffSecs }));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data?.tasks]);

  const startTask = async (taskId: string) => {
    setActionLoading((prev) => new Set(prev).add(taskId));
    setError(null);
    try {
      const r = await fetch(`/api/tareas/${taskId}/work-start`, { method: "POST" });
      if (!r.ok) {
        const errJson = await r.json();
        throw new Error(errJson.error ?? "No se pudo iniciar el trabajo.");
      }
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar tarea");
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const stopTask = async (taskId: string) => {
    setActionLoading((prev) => new Set(prev).add(taskId));
    setError(null);
    try {
      // Don't auto-submit for review on the quick stop
      const r = await fetch(`/api/tareas/${taskId}/work-stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitForReview: false }),
      });
      if (!r.ok) {
        const errJson = await r.json();
        throw new Error(errJson.error ?? "No se pudo detener el trabajo.");
      }
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al detener tarea");
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const completeTask = async (taskId: string) => {
    setActionLoading((prev) => new Set(prev).add(taskId));
    setError(null);
    try {
      const r = await fetch(`/api/tareas/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      const resJson = await r.json();
      if (!r.ok) {
        throw new Error(
          resJson.message ?? "No se pudo completar la tarea. Verifica evidencia o checklist."
        );
      }
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al completar tarea");
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-white/55 gap-3">
        <Loader2 className="animate-spin text-[var(--color-brand-500)]" size={24} />
        <span className="text-sm">Cargando tus misiones de hoy…</span>
      </div>
    );
  }

  const tasks = data?.tasks ?? [];
  const completedToday = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

  const punchHours = data?.today.hours ?? 0;
  const taskHours = data?.todayTaskHours ?? 0;
  const gap = Math.max(0, punchHours - taskHours);
  const timeProgressPercent = punchHours > 0 ? Math.min(100, Math.round((taskHours / punchHours) * 100)) : 0;

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
      {/* LEFT: TODAY'S QUESTS */}
      <div className="space-y-4">
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              Misiones de hoy
            </h3>
            <span className="text-xs text-white/45 font-semibold">
              {completedToday} de {totalTasks} completadas
            </span>
          </div>

          {/* Quest Progress Bar */}
          {totalTasks > 0 ? (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/45 font-bold uppercase tracking-wider">
                <span>Progreso diario</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-[var(--color-brand-500)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/40 italic">No tienes tareas asignadas para hoy.</p>
          )}

          {/* Action error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-semibold flex items-start gap-2"
              >
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-400" />
                <div>
                  <span className="font-bold block mb-0.5">Misión bloqueada</span>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quests list */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const isActive = task.activeSession !== null;
              const isDone = task.status === "done";
              const isReview = task.status === "review";
              const elapsed = elapsedMap[task.id] ?? 0;
              const isLoading = actionLoading.has(task.id);

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 transition-all flex items-center justify-between gap-4 ${
                    isActive
                      ? "border-[var(--color-brand-500)]/60 bg-[var(--color-brand-500)]/5 shadow-md shadow-[var(--color-brand-500)]/5"
                      : isDone
                      ? "border-emerald-500/20 bg-emerald-500/3 opacity-70"
                      : "border-white/8 bg-white/3 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Status Checkbox */}
                    <button
                      onClick={() => !isDone && !isReview && completeTask(task.id)}
                      disabled={isDone || isReview || isLoading}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        isDone
                          ? "bg-emerald-500 border-transparent text-[var(--color-ink-950)]"
                          : isReview
                          ? "bg-sky-500/30 border-sky-400 text-sky-300"
                          : "border-white/20 hover:border-[var(--color-brand-500)] text-transparent hover:text-[var(--color-brand-400)]"
                      }`}
                    >
                      <CheckCircle2 size={15} className="fill-current" />
                    </button>

                    <div className="min-w-0">
                      <h4
                        className={`font-semibold text-sm leading-snug truncate ${
                          isDone ? "line-through text-white/40" : "text-white"
                        }`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-white/45 font-semibold">
                        {task.hours > 0 && <span>{task.hours}h estimadas</span>}
                        {task.dueDate && (
                          <span>
                            Vence: {new Date(task.dueDate).toLocaleDateString("es-PR", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {isActive && (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-emerald-400 text-xs font-bold tabular-nums">
                          {formatTimer(elapsed)}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-emerald-400/70">
                          activo
                        </span>
                      </div>
                    )}

                    {!isDone && !isReview && (
                      <button
                        onClick={() => (isActive ? stopTask(task.id) : startTask(task.id))}
                        disabled={isLoading}
                        className={`p-2 rounded-xl transition ${
                          isActive
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                            : "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] border border-[var(--color-brand-500)]/30 hover:bg-[var(--color-brand-500)]/25"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isActive ? (
                          <Square size={14} fill="currentColor" />
                        ) : (
                          <Play size={14} fill="currentColor" />
                        )}
                      </button>
                    )}

                    {isReview && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold uppercase tracking-wider px-2 py-1 rounded-lg">
                        En revisión
                      </span>
                    )}

                    {isDone && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider px-2 py-1 rounded-lg">
                        Completada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                <p className="text-sm text-white/45">¡Felicidades! No tienes misiones pendientes hoy. 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: COMPARISON BOARD */}
      <div className="space-y-4">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 flex items-center gap-2">
            <Clock size={16} className="text-emerald-400" />
            Ponche vs Tareas
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/3 border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/45">Horas Ponchadas</span>
              <p className="text-2xl font-extrabold mt-1 text-white tabular-nums">{punchHours.toFixed(2)}h</p>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/45">Horas en Tareas</span>
              <p className="text-2xl font-extrabold mt-1 text-[var(--color-brand-400)] tabular-nums">
                {taskHours.toFixed(2)}h
              </p>
            </div>
          </div>

          {/* Time Progress Ratio */}
          {punchHours > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/45 font-bold uppercase tracking-wider">
                <span>Eficiencia de registro</span>
                <span>{timeProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${timeProgressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Gap Feedback Card */}
          {punchHours > 0 && (
            <AnimatePresence mode="wait">
              {gap > 0.1 ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/8 text-amber-300 text-xs font-semibold flex items-start gap-2"
                >
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    Tienes <span className="underline font-bold">{gap.toFixed(2)}h</span> de tu turno de hoy sin
                    registrar en ninguna tarea. Recuerda iniciar el cronómetro al comenzar una labor.
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 text-emerald-300 text-xs font-semibold flex items-start gap-2"
                >
                  <Trophy size={15} className="shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    ¡Excelente! Has registrado el total de tus horas ponchadas en misiones de trabajo de hoy.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Today's logged time entries */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-white/45" /> Tareas trabajadas hoy
            </span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {data?.todayTimeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-white/3 border border-white/5"
                >
                  <span className="font-semibold text-white/80 truncate max-w-[70%]">
                    {entry.taskTitle}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.note && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                        {entry.note.replace("Sesión de trabajo ", "")}
                      </span>
                    )}
                    <span className="font-bold text-[var(--color-brand-400)] tabular-nums">
                      {entry.hours.toFixed(2)}h
                    </span>
                  </div>
                </div>
              ))}

              {data?.todayTimeEntries.length === 0 && (
                <p className="text-xs text-white/35 italic py-4 text-center">
                  Aún no has registrado horas en tareas hoy.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
