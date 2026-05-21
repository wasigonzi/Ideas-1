"use client";

import { TrelloBoard, type BoardColumn } from "./TrelloBoard";
import { PriorityPill } from "./ui";
import { Calendar, Briefcase, DollarSign } from "lucide-react";

export type OrderCard = {
  id: string;
  status: string;
  number: string;
  title: string;
  service: string;
  total: number;
  priority: string;
  dueDate: string | null;
  clientName: string | null;
  totalTasks: number;
  doneTasks: number;
};

const COLUMNS: BoardColumn[] = [
  { key: "pending", label: "Pendientes", accent: "bg-white/40" },
  { key: "in_progress", label: "En producción", accent: "bg-sky-400" },
  { key: "review", label: "En revisión", accent: "bg-amber-400" },
  { key: "completed", label: "Completadas", accent: "bg-emerald-400" }
];

export function OrderBoard({ orders, onCardClick }: { orders: OrderCard[]; onCardClick?: (o: OrderCard) => void }) {
  return (
    <TrelloBoard<OrderCard>
      initialItems={orders}
      columns={COLUMNS}
      endpoint={(id) => `/api/ordenes/${id}`}
      onCardClick={onCardClick}
      renderCard={(o) => {
        const pct = o.totalTasks > 0 ? Math.round((o.doneTasks / o.totalTasks) * 100) : 0;
        return (
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:border-[var(--color-brand-500)]/40 transition">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono text-[var(--color-brand-400)]">{o.number}</div>
                <div className="font-medium text-sm leading-snug mt-0.5">{o.title}</div>
              </div>
              <PriorityPill priority={o.priority} />
            </div>
            <div className="text-[11px] text-white/55 flex items-center gap-1 mt-2">
              <Briefcase size={11} /> {o.service}
            </div>
            {o.clientName && (
              <div className="text-[11px] text-white/70 mt-0.5">{o.clientName}</div>
            )}
            <div className="mt-3">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-brand-500)]" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-white/45 mt-1">
                {o.doneTasks}/{o.totalTasks} tareas · {pct}%
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-white/65">
              <span className="flex items-center gap-1 font-bold text-[var(--color-brand-400)]">
                <DollarSign size={11} /> {o.total.toLocaleString()}
              </span>
              {o.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {new Date(o.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
