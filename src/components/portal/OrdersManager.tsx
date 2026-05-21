"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, DollarSign, Users } from "lucide-react";
import { OrderBoard, type OrderCard } from "./OrderBoard";
import { TaskBoard, type TaskCard } from "./TaskBoard";
import { StatusPill, PriorityPill } from "./ui";
import type { EditorOrder, EditorUser } from "./TaskEditor";
import type { BoardColumn } from "./TrelloBoard";

export function OrdersManager({
  orders,
  tasks,
  users,
  taskColumns,
  totalOrders,
  cancelledOrders,
}: {
  orders: OrderCard[];
  tasks: TaskCard[];
  users: EditorUser[];
  taskColumns: BoardColumn[];
  totalOrders: number;
  cancelledOrders: number;
}) {
  const [selected, setSelected] = useState<OrderCard | null>(null);
  const router = useRouter();

  const handleOrderClick = useCallback((o: OrderCard) => {
    setSelected(o);
  }, []);

  if (selected) {
    const orderTasks = tasks.filter((t) => t.orderId === selected.id);
    const editorOrder: EditorOrder = {
      id: selected.id,
      number: selected.number,
      title: selected.title,
      clientName: selected.clientName,
    };
    const pct =
      selected.totalTasks > 0
        ? Math.round((selected.doneTasks / selected.totalTasks) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => {
              setSelected(null);
              router.refresh();
            }}
            className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition mb-4"
          >
            <ArrowLeft size={15} /> Volver a todas las órdenes
          </button>

          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[var(--color-brand-400)] mb-1">
                  {selected.number}
                </div>
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Briefcase size={13} /> {selected.service}
                  </span>
                  {selected.clientName && (
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {selected.clientName}
                    </span>
                  )}
                  {selected.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />{" "}
                      {new Date(selected.dueDate).toLocaleDateString("es-PR")}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-bold text-[var(--color-brand-400)]">
                    <DollarSign size={13} /> {selected.total.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PriorityPill priority={selected.priority} />
                <StatusPill status={selected.status} />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>
                  {selected.doneTasks}/{selected.totalTasks} tareas completadas
                </span>
                <span>{pct}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-brand-500)] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Tareas de producción
          </h3>
          <TaskBoard
            tasks={orderTasks}
            users={users}
            orders={[editorOrder]}
            columns={taskColumns}
            defaultOrderId={selected.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="heading-lg">Órdenes de Trabajo</h1>
          <p className="text-white/65 mt-1">
            Haz clic en una orden para ver y gestionar sus tareas.
          </p>
        </div>
        <div className="text-xs text-white/55">
          {totalOrders} activas · {cancelledOrders} canceladas
        </div>
      </header>
      <OrderBoard orders={orders} onCardClick={handleOrderClick} />
    </div>
  );
}
