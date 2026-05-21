"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StatusPill, PriorityPill, ProgressBar } from "./ui";
import { CommentsActivity } from "./TaskEditor";
import {
  ClipboardList,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Clock,
  ChevronRight,
} from "lucide-react";

export type ClientTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  hours: number;
  dueDate: string | null;
  coverImage: string | null;
  assigneeId: string | null;
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isOverdue(t: ClientTask) {
  return t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date();
}

const STATUS_LABEL: Record<string, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  blocked: "Bloqueada",
  done: "Hecha",
};

export function ClientTaskView({ tasks, currentUserId }: { tasks: ClientTask[]; currentUserId?: string }) {
  const [selected, setSelected] = useState<ClientTask | null>(null);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;

  // On mobile we show either the list or the detail (never both).
  // On sm+ we show them side by side.

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* ── Task list (hidden on mobile when something is selected) ── */}
      <div
        className={`flex-1 min-w-0 space-y-3 ${
          selected ? "hidden sm:block sm:w-72 sm:flex-none" : ""
        }`}
      >
        {totalCount > 0 && (
          <div className="rounded-xl bg-white/4 border border-white/8 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Progreso general</span>
              <span className="font-semibold">{doneCount} / {totalCount} completadas</span>
            </div>
            <ProgressBar value={doneCount} max={totalCount} />
          </div>
        )}

        {tasks.length === 0 && (
          <div className="card p-12 flex flex-col items-center gap-3 text-white/35">
            <ClipboardList size={36} />
            <p className="text-sm">No hay tareas asignadas todavía.</p>
          </div>
        )}

        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all ${
              selected?.id === t.id
                ? "bg-[var(--color-brand-500)]/8 border-[var(--color-brand-500)]/30"
                : "bg-white/4 border-white/8 hover:bg-white/6 hover:border-white/15"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              <StatusPill status={t.status} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-snug truncate">
                {t.title}
              </div>
              {t.description && (
                <p className="text-xs text-white/45 mt-0.5 line-clamp-1">
                  {t.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <PriorityPill priority={t.priority} />
                {t.dueDate && (
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue(t) ? "text-red-400" : "text-white/40"
                    }`}
                  >
                    {isOverdue(t) && <AlertCircle size={10} />}
                    <Calendar size={10} />
                    {fmtDate(t.dueDate)}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={14} className="shrink-0 text-white/25 mt-1" />
          </button>
        ))}
      </div>

      {/* ── Detail panel ── */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="flex-1 min-w-0 sm:max-w-xl space-y-5"
          >
            {/* Back button (mobile only) */}
            <button
              onClick={() => setSelected(null)}
              className="sm:hidden inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
            >
              <ArrowLeft size={15} /> Volver a mis tareas
            </button>

            <div className="card p-5 space-y-4">
              {/* Cover image */}
              {selected.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.coverImage}
                  alt="Portada"
                  className="w-full h-36 object-cover rounded-lg"
                />
              )}

              {/* Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusPill status={selected.status} />
                  <PriorityPill priority={selected.priority} />
                </div>
                <h2 className="text-lg font-bold leading-snug">{selected.title}</h2>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-xs text-white/45">
                  {selected.dueDate && (
                    <span
                      className={`flex items-center gap-1 ${
                        isOverdue(selected) ? "text-red-400" : ""
                      }`}
                    >
                      {isOverdue(selected) && <AlertCircle size={11} />}
                      <Calendar size={11} />
                      Vence {fmtDate(selected.dueDate)}
                    </span>
                  )}
                  {selected.hours > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {selected.hours}h estimadas
                    </span>
                  )}
                  <span className="text-white/35">
                    Estado: {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed border-t border-white/8 pt-4">
                  {selected.description}
                </p>
              )}
            </div>

            {/* Comments & Activity */}
            <div className="card p-5">
              <CommentsActivity taskId={selected.id} users={[]} currentUserId={currentUserId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
