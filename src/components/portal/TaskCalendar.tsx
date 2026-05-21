"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TaskCard } from "./TaskBoard";
import type { BoardColumn } from "./TrelloBoard";

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-sky-500",
  low: "bg-white/30",
};

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function TaskCalendar({
  tasks,
  columns,
  onCardClick,
}: {
  tasks: TaskCard[];
  columns: BoardColumn[];
  onCardClick?: (t: TaskCard) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Build calendar grid (fill with nulls for leading/trailing days)
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Group tasks by date key
  const tasksByDay = new Map<string, TaskCard[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const k = dateKey(new Date(t.dueDate));
    const arr = tasksByDay.get(k) ?? [];
    arr.push(t);
    tasksByDay.set(k, arr);
  }

  const todayKey = dateKey(today);

  // Find column label for a status
  const colLabel = (status: string) =>
    columns.find((c) => c.key === status)?.label ?? status;

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <button onClick={prev} className="p-2 rounded-lg hover:bg-white/10 text-white/65 hover:text-white">
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-extrabold text-base">
          {MONTHS_ES[month]} {year}
        </h3>
        <button onClick={next} className="p-2 rounded-lg hover:bg-white/10 text-white/65 hover:text-white">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/8">
          {DAYS_ES.map((d) => (
            <div key={d} className="text-center py-2 text-[11px] uppercase tracking-widest text-white/40 font-bold">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: cells.length / 7 }, (_, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
              const key = day ? `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}` : null;
              const dayTasks = key ? (tasksByDay.get(key) ?? []) : [];
              const isToday = key === todayKey;
              const isPast = key != null && key < todayKey;

              return (
                <div
                  key={di}
                  className={`min-h-[90px] border-r border-b border-white/5 last:border-r-0 p-1.5 ${
                    !day ? "bg-white/[0.01]" : isPast ? "bg-white/[0.015]" : "bg-white/[0.03]"
                  }`}
                >
                  {day && (
                    <>
                      <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full mb-1 ${
                        isToday
                          ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)]"
                          : "text-white/55"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => onCardClick?.(t)}
                            className="w-full text-left rounded px-1.5 py-1 text-[11px] leading-tight truncate hover:opacity-80 transition flex items-center gap-1"
                            style={{ background: "rgba(255,255,255,0.07)" }}
                          >
                            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${PRIORITY_COLOR[t.priority] ?? "bg-white/30"}`} />
                            <span className={`truncate ${t.status === "done" ? "line-through opacity-40" : ""}`}>
                              {t.title}
                            </span>
                          </button>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[10px] text-white/35 pl-1">
                            +{dayTasks.length - 3} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-white/45 px-1">
        {Object.entries(PRIORITY_COLOR).map(([k, cls]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
            {k === "urgent" ? "Urgente" : k === "high" ? "Alta" : k === "normal" ? "Normal" : "Baja"}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-2">
          Columnas activas: {columns.map(c => c.label).join(" · ")}
        </span>
      </div>
    </div>
  );
}
