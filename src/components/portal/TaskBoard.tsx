"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrelloBoard, type BoardColumn } from "./TrelloBoard";
import { MemberAvatar } from "./Avatar";
import { AlignLeft, Calendar, Clock, Plus, X, Loader2, Maximize2, Paperclip, LayoutGrid, CalendarDays, Search, Archive } from "lucide-react";
import { TaskEditor, type EditorUser } from "./TaskEditor";
import { TaskCalendar } from "./TaskCalendar";
import { useRealtimeRefresh } from "@/lib/realtime";
import type { ColumnOwnerDTO } from "@/lib/task-columns";

export type TaskMember = {
  id: string;
  name: string;
  avatar: string | null;
  role: string; // "admin" | "employee" | "client"
};

export type TaskCard = {
  id: string;
  status: string;
  position?: number;
  title: string;
  description: string | null;
  priority: string;
  hours: number;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  coverImage?: string | null;
  attachments?: string[];
  members?: TaskMember[];
  orderId?: string | null;
  orderNumber?: string | null;
  clientName?: string | null;
  /** Total seconds logged in ended WorkSessions (employee time tracking) */
  loggedSeconds?: number;
  /** Active work session, if the employee is currently clocked in */
  activeSession?: { id: string; startedAt: string } | null;
};

const DEFAULT_COLUMNS: BoardColumn[] = [
  { key: "todo",        label: "Por hacer",     accent: "bg-amber-500" },
  { key: "in_progress", label: "En progreso",   accent: "bg-violet-500" },
  { key: "review",      label: "Para revisión", accent: "bg-sky-500" },
  { key: "produccion",  label: "Producción",    accent: "bg-orange-500" },
  { key: "blocked",     label: "Bloqueadas",    accent: "bg-rose-500" },
  { key: "done",        label: "Hechas",        accent: "bg-emerald-500" }
];

export function TaskBoard({
  tasks,
  users,
  canEdit = true,
  columns,
  columnOwners,
  currentUserId,
  orders,
  defaultOrderId,
}: {
  tasks: TaskCard[];
  users: EditorUser[];
  canEdit?: boolean;
  columns?: BoardColumn[];
  columnOwners?: Record<string, ColumnOwnerDTO[]>;
  currentUserId?: string;
  orders?: import("./TaskEditor").EditorOrder[];
  defaultOrderId?: string;
}) {
  const router = useRouter();
  useRealtimeRefresh({
    channelName: `portal-tasks-${currentUserId ?? "admin"}`,
    tables: ["Task", "TaskColumn", "TaskComment", "TaskActivity", "TaskView", "ApprovalSheet", "WorkSession", "TimeEntry", "Order"],
    fallbackMs: 15000,
  });

  const cols = columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;
  const [editorOpen, setEditorOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [active, setActive] = useState<TaskCard | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<string>("todo");

  // Optimistic local copy of tasks — updated immediately on save so the board
  // reflects changes without waiting for router.refresh() to complete.
  const [liveTasks, setLiveTasks] = useState<TaskCard[]>(tasks);
  // Keep in sync when the server-refresh eventually delivers new props.
  useEffect(() => { setLiveTasks(tasks); }, [tasks]);

  // ─ View & filters (persisted in localStorage) ─
  const LS_KEY = "taskboard_filters";

  // Always start with defaults so SSR and first client render match (no hydration mismatch).
  // localStorage values are applied after mount in a useEffect.
  const [viewMode, setViewMode] = useState<"board" | "calendar">("board");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterDue, setFilterDue] = useState<"all" | "overdue" | "week">("all");
  const [search, setSearch] = useState<string>("");

  // Restore persisted filters after hydration, then keep them in sync.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
      if (saved.viewMode) setViewMode(saved.viewMode);
      if (saved.filterAssignee) setFilterAssignee(saved.filterAssignee);
      if (saved.filterPriority) setFilterPriority(saved.filterPriority);
      if (saved.filterDue) setFilterDue(saved.filterDue);
      if (saved.search) setSearch(saved.search);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ viewMode, filterAssignee, filterPriority, filterDue, search }));
    } catch { /* ignore */ }
  }, [viewMode, filterAssignee, filterPriority, filterDue, search]);

  // Dynamically fetch all assignable users as a fallback when the server-side
  // prop is empty (e.g. employee portal passes users=[]). Both admins and
  // employees can call /api/empleados GET now.
  const [liveUsers, setLiveUsers] = useState<EditorUser[]>(users);

  // Keep liveUsers in sync if the prop updates (e.g. router.refresh())
  useEffect(() => { setLiveUsers(users); }, [users]);

  // Default column owners ("Responsable por columna"), updated optimistically
  // as soon as the picker in ColumnMenu saves, without waiting for router.refresh().
  const [liveColumnOwners, setLiveColumnOwners] = useState<Record<string, ColumnOwnerDTO[]>>(columnOwners ?? {});
  useEffect(() => { setLiveColumnOwners(columnOwners ?? {}); }, [columnOwners]);

  useEffect(() => {
    if (users.length > 0) return; // already have users from SSR
    fetch("/api/empleados")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { id: string; name: string | null; email: string; role: string; avatar: string | null; company: string | null }[] | null) => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        const mapped: EditorUser[] = data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar ?? null,
          company: u.company ?? null,
        }));
        setLiveUsers(mapped);
      })
      .catch(() => null);
  }, [users]);
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    const q = search.trim().toLowerCase();
    return liveTasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (filterAssignee && t.assigneeId !== filterAssignee && !(t.members ?? []).some((m) => m.id === filterAssignee)) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterDue === "overdue" && (t.status === "done" || !t.dueDate || new Date(t.dueDate) >= now)) return false;
      if (filterDue === "week" && (!t.dueDate || new Date(t.dueDate) < now || new Date(t.dueDate) > weekEnd)) return false;
      return true;
    });
  }, [tasks, filterAssignee, filterPriority, filterDue, search]);

  function openCreate(status: string) {
    setMode("create");
    setActive(null);
    setDefaultStatus(status);
    setEditorOpen(true);
  }
  function openEdit(t: TaskCard) {
    setMode("edit");
    setActive(t);
    setEditorOpen(true);
  }

  const [archiving, setArchiving] = useState(false);
  const archiveDone = useCallback(async () => {
    if (!confirm("¿Archivar todas las tareas en la columna 'Hechas'? Dejarán de aparecer en el tablero.")) return;
    setArchiving(true);
    try {
      await fetch("/api/tareas/archive-done", { method: "POST" });
      router.refresh();
    } catch { /* ignore */ } finally {
      setArchiving(false);
    }
  }, [router]);

  return (
    <>
      {/* ── Toolbar: view toggle + filters ── */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Nueva Tarea */}
        {canEdit && (
          <button
            onClick={() => openCreate(cols[0]?.key ?? "todo")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] text-xs font-bold hover:brightness-110 transition"
          >
            <Plus size={13} /> Nueva Tarea
          </button>
        )}

        {/* Search */}
        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2.5 text-white/35 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar trabajo..."
            className="pl-7 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/85 placeholder-white/30 focus:outline-none focus:border-[var(--color-brand-500)] w-44"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 text-white/35 hover:text-white/70"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-0.5 p-0.5 bg-white/5 rounded-lg">
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === "board"
                ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)]"
                : "text-white/55 hover:text-white"
            }`}
          >
            <LayoutGrid size={12} /> Tablero
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === "calendar"
                ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)]"
                : "text-white/55 hover:text-white"
            }`}
          >
            <CalendarDays size={12} /> Calendario
          </button>
        </div>

        {/* Assignee filter */}
        {liveUsers.length > 0 && (
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 focus:outline-none focus:border-[var(--color-brand-500)]"
          >
            <option value="">Todos los miembros</option>
            {liveUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
        )}

        {/* Priority filter */}
        {([["", "Prioridad"], ["urgent", "Urgente"], ["high", "Alta"], ["normal", "Normal"], ["low", "Baja"]] as [string,string][]).map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilterPriority(val)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterPriority === val
                ? "bg-[var(--color-brand-500)]/20 text-[var(--color-brand-300)] border border-[var(--color-brand-500)]/40"
                : "bg-white/5 text-white/45 hover:text-white border border-transparent"
            }`}
          >
            {lbl}
          </button>
        ))}

        {/* Due date filter */}
        {(([["all","Todas"],["overdue","Vencidas"],["week","Esta semana"]] as ["all"|"overdue"|"week",string][]).map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilterDue(val)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterDue === val && val !== "all"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : filterDue === val
                ? "bg-white/8 text-white/80 border border-white/15"
                : "bg-white/5 text-white/45 hover:text-white border border-transparent"
            }`}
          >
            {lbl}
          </button>
        )))}

        {(filterAssignee || filterPriority || filterDue !== "all" || search) && (
          <button
            onClick={() => { setFilterAssignee(""); setFilterPriority(""); setFilterDue("all"); setSearch(""); }}
            className="px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8"
          >
            × Limpiar
          </button>
        )}

        {/* Archive done tasks */}
        {canEdit && (
          <button
            onClick={archiveDone}
            disabled={archiving}
            title="Archivar todas las tareas Hechas"
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-50"
          >
            {archiving ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
            Archivar hechas
          </button>
        )}
      </div>

      {/* ── Calendar view ── */}
      {viewMode === "calendar" && (
        <TaskCalendar
          tasks={filteredTasks}
          columns={cols}
          onCardClick={openEdit}
        />
      )}

      {/* ── Board view ── */}
      {viewMode === "board" && (
      <TrelloBoard<TaskCard>
        initialItems={filteredTasks}
        columns={cols}
        endpoint={(id) => `/api/tareas/${id}`}
        onCardClick={openEdit}
        onAddColumn={
          canEdit
            ? async (label) => {
                const res = await fetch("/api/tareas/columns", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ label })
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j.error ?? "Error al crear lista");
                }
                router.refresh();
              }
            : undefined
        }
        onUpdateColumn={
          canEdit
            ? async (key, patch) => {
                const res = await fetch(`/api/tareas/columns/${encodeURIComponent(key)}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(patch)
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j.error ?? "Error al actualizar lista");
                }
                router.refresh();
              }
            : undefined
        }
        onDeleteColumn={
          canEdit
            ? async (key) => {
                const res = await fetch(`/api/tareas/columns/${encodeURIComponent(key)}`, {
                  method: "DELETE"
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j.error ?? "Error al eliminar lista");
                }
                router.refresh();
              }
            : undefined
        }
        renderColumnFooter={
          canEdit
            ? (col) => (
                <QuickAddComposer
                  status={col.key}
                  onExpand={() => openCreate(col.key)}
                />
              )
            : undefined
        }
        renderColumnHeaderExtra={(col) => (
          <ColumnOwnerAvatars owners={liveColumnOwners[col.key] ?? []} />
        )}
        renderColumnMenuExtra={
          canEdit
            ? (col) => (
                <ColumnOwnerPicker
                  col={col}
                  users={liveUsers}
                  owners={liveColumnOwners[col.key] ?? []}
                  onSaved={(next) =>
                    setLiveColumnOwners((prev) => ({ ...prev, [col.key]: next }))
                  }
                />
              )
            : undefined
        }
        renderCard={(t) => {
          // Trello-style behavior: if no explicit cover is set, use the first
          // image attachment as the cover automatically.
          const cover = t.coverImage || t.attachments?.[0] || null;
          return (
          <div className="rounded-lg bg-[#22272b] border border-white/5 hover:border-[var(--color-brand-500)]/50 hover:ring-1 hover:ring-[var(--color-brand-500)]/30 transition overflow-hidden shadow-sm">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                draggable={false}
                className="w-full h-32 object-cover bg-black/30"
              />
            )}
            <div className="px-3 py-2.5">
              <div className="font-medium text-[13px] leading-snug text-white/95 mb-2">
                {t.title}
              </div>

              {/* Trello-style labels row */}
              <div className="flex flex-wrap items-center gap-1 mb-2">
                <StatusChip status={t.status} columns={cols} />
                <PriorityChip priority={t.priority} />
              </div>

              {/* Trello-style icon meta row */}
              <div className="flex items-center gap-3 text-[11px] text-white/55">
                {t.description && (
                  <span title="Tiene descripción" className="flex items-center">
                    <AlignLeft size={12} />
                  </span>
                )}
                {(t.attachments?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1" title="Adjuntos">
                    <Paperclip size={12} /> {t.attachments!.length}
                  </span>
                )}
                {t.hours > 0 && (
                  <span className="flex items-center gap-1" title="Horas estimadas">
                    <Clock size={12} /> {t.hours}h
                  </span>
                )}
                {t.dueDate && (
                  <span className="flex items-center gap-1" title="Fecha límite">
                    <Calendar size={12} />{" "}
                    {new Date(t.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                )}
              </div>

              {/* Member avatars at the bottom-right (Trello layout) */}
              <div className="flex items-end justify-end mt-2 min-h-[22px]">
                <MemberStack members={t.members ?? []} fallbackName={t.assigneeName} />
              </div>
            </div>
          </div>
          );
        }}
      />
      )}

      <TaskEditor
        open={editorOpen}
        mode={mode}
        task={active}
        defaultStatus={defaultStatus}
        users={liveUsers}
        canEdit={canEdit}
        currentUserId={currentUserId}
        orders={orders}
        defaultOrderId={defaultOrderId}
        columns={cols}
        onClose={() => setEditorOpen(false)}
        onSaved={(updated) => {
          // Update the board card immediately (optimistic)
          setLiveTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
          setActive(updated);
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stacked member avatars shown at the bottom-right of every card (Trello-style).
// ─────────────────────────────────────────────────────────────────────────────
function MemberStack({
  members,
  fallbackName
}: {
  members: TaskMember[];
  fallbackName: string | null;
}) {
  if (members.length === 0) {
    return (
      <span className="text-white/35 text-[11px]">
        {fallbackName ?? "Sin miembros"}
      </span>
    );
  }
  const visible = members.slice(0, 4);
  const overflow = members.length - visible.length;
  return (
    <span className="flex items-center -space-x-1.5">
      {visible.map((m) => (
        <MemberAvatar
          key={m.id}
          id={m.id}
          name={m.name}
          avatar={m.avatar}
          size={22}
          ring
          title={`${m.name}${m.role === "client" ? " (Cliente)" : ""}`}
        />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-white/15 text-white text-[10px] font-semibold ring-2 ring-[var(--color-ink-900,#0a1322)]"
          style={{ width: 22, height: 22 }}
          title={members.slice(4).map((m) => m.name).join(", ")}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Responsable por columna": small avatar stack shown in the column header,
// and the picker rendered inside "Opciones de lista" (ColumnMenu) to manage it.
// ─────────────────────────────────────────────────────────────────────────────
function ColumnOwnerAvatars({ owners }: { owners: ColumnOwnerDTO[] }) {
  if (owners.length === 0) return null;
  const visible = owners.slice(0, 3);
  const overflow = owners.length - visible.length;
  return (
    <span
      className="flex items-center -space-x-1.5"
      title={`Responsable(s) por defecto: ${owners.map((o) => o.name ?? o.email).join(", ")}`}
    >
      {visible.map((o) => (
        <MemberAvatar key={o.id} id={o.id} name={o.name ?? o.email} avatar={o.avatar} size={18} ring />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-white/15 text-white text-[9px] font-semibold ring-2 ring-[var(--color-ink-900,#0a1322)]"
          style={{ width: 18, height: 18 }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

function ColumnOwnerPicker({
  col,
  users,
  owners,
  onSaved
}: {
  col: BoardColumn;
  users: EditorUser[];
  owners: ColumnOwnerDTO[];
  onSaved: (next: ColumnOwnerDTO[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ownerIds = new Set(owners.map((o) => o.id));

  async function toggle(user: EditorUser) {
    const nextIds = ownerIds.has(user.id)
      ? owners.filter((o) => o.id !== user.id).map((o) => o.id)
      : [...owners.map((o) => o.id), user.id];
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tareas/columns/${encodeURIComponent(col.key)}/owners`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: nextIds })
      });
      if (!res.ok) throw new Error("No se pudo guardar el responsable.");
      const next: ColumnOwnerDTO[] = await res.json();
      onSaved(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
        Responsable(s) por defecto
      </label>
      <p className="text-[10px] text-white/40 mt-0.5 mb-1.5">
        Se asignan automáticamente a cada tarjeta que entre a esta lista.
      </p>
      <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
        {users.map((u) => {
          const checked = ownerIds.has(u.id);
          return (
            <button
              key={u.id}
              type="button"
              disabled={busy}
              onClick={() => toggle(u)}
              className={`w-full flex items-center gap-2 px-1.5 py-1 rounded-md text-left text-xs transition disabled:opacity-50 ${
                checked ? "bg-[var(--color-brand-500)]/15 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              <MemberAvatar id={u.id} name={u.name ?? u.email} avatar={u.avatar} size={18} />
              <span className="truncate flex-1">{u.name ?? u.email}</span>
              {checked && <span className="text-[var(--color-brand-400,#7dd3fc)]">✓</span>}
            </button>
          );
        })}
        {users.length === 0 && (
          <div className="text-[11px] text-white/40 py-2">Sin usuarios disponibles.</div>
        )}
      </div>
      {error && <div className="text-[11px] text-red-300 mt-1">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trello-style colored label chips (status + priority) shown on each card.
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  todo: { label: "Por hacer", cls: "bg-amber-500/85 text-amber-950" },
  in_progress: { label: "En progreso", cls: "bg-violet-500/85 text-violet-950" },
  blocked: { label: "Bloqueada", cls: "bg-rose-500/85 text-rose-950" },
  done: { label: "Hecha", cls: "bg-emerald-500/85 text-emerald-950" }
};

// Map a tailwind "bg-xxx-500" accent class into a chip class with a darker
// readable text color. Static lookup so Tailwind's JIT keeps the classes.
const ACCENT_CHIP: Record<string, string> = {
  "bg-amber-500": "bg-amber-500/85 text-amber-950",
  "bg-orange-500": "bg-orange-500/85 text-orange-950",
  "bg-rose-500": "bg-rose-500/85 text-rose-950",
  "bg-red-500": "bg-red-500/85 text-red-950",
  "bg-violet-500": "bg-violet-500/85 text-violet-950",
  "bg-fuchsia-500": "bg-fuchsia-500/85 text-fuchsia-950",
  "bg-indigo-500": "bg-indigo-500/85 text-indigo-950",
  "bg-sky-500": "bg-sky-500/85 text-sky-950",
  "bg-cyan-500": "bg-cyan-500/85 text-cyan-950",
  "bg-emerald-500": "bg-emerald-500/85 text-emerald-950",
  "bg-lime-500": "bg-lime-500/85 text-lime-950",
  "bg-slate-500": "bg-slate-500/85 text-slate-950"
};

function accentToChipClass(accent: string | null | undefined): string {
  if (!accent) return "bg-white/15 text-white/85";
  return ACCENT_CHIP[accent] ?? "bg-white/15 text-white/85";
}

function StatusChip({
  status,
  columns
}: {
  status: string;
  columns: BoardColumn[];
}) {
  const fromCols = columns.find((c) => c.key === status);
  if (fromCols) {
    return (
      <span
        className={`inline-flex max-w-full truncate text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded ${accentToChipClass(
          fromCols.accent
        )}`}
      >
        {fromCols.label}
      </span>
    );
  }
  const s = STATUS_CHIP[status] ?? { label: status, cls: "bg-white/15 text-white/85" };
  return (
    <span
      className={`inline-flex max-w-full truncate text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const PRIORITY_CHIP: Record<string, { label: string; cls: string }> = {
  low: { label: "Prioridad: Baja", cls: "bg-sky-500/85 text-sky-950" },
  normal: { label: "Prioridad: Normal", cls: "bg-slate-400/80 text-slate-900" },
  high: { label: "Prioridad: Alta", cls: "bg-orange-500/90 text-orange-950" },
  urgent: { label: "Prioridad: Urgente", cls: "bg-red-600 text-white" }
};

function PriorityChip({ priority }: { priority: string }) {
  const p = PRIORITY_CHIP[priority];
  if (!p) return null;
  return (
    <span
      className={`inline-flex max-w-full truncate text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded ${p.cls}`}
    >
      {p.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trello-style inline composer: click "+ Add card" → reveals a textarea pinned
// at the bottom of the column. Enter (or Add card) creates the task and keeps
// the composer open so multiple cards can be added quickly. Esc/Cancel closes.
// ─────────────────────────────────────────────────────────────────────────────
function QuickAddComposer({
  status,
  onExpand
}: {
  status: string;
  onExpand: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function handleOpen() {
    setOpen(true);
    setError(null);
    // Focus on next tick after the textarea mounts.
    setTimeout(() => taRef.current?.focus(), 0);
  }

  function handleClose() {
    setOpen(false);
    setTitle("");
    setError(null);
  }

  async function handleAdd() {
    const value = title.trim();
    if (!value || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value, status })
      });
      if (!res.ok) throw new Error("create failed");
      setTitle("");
      router.refresh();
      // Keep composer open Trello-style; refocus for the next card.
      setTimeout(() => taRef.current?.focus(), 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-white/60 hover:text-white border border-dashed border-white/15 hover:border-[var(--color-brand-500)]/50 hover:bg-[var(--color-brand-500)]/5 rounded-xl py-2.5 transition"
      >
        <Plus size={14} /> Añadir una tarjeta
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/15 p-2 space-y-2">
      <textarea
        ref={taRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
          } else if (e.key === "Escape") {
            e.preventDefault();
            handleClose();
          }
        }}
        rows={2}
        placeholder="Introduce un título para esta tarjeta…"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:border-[var(--color-brand-500)]/60 focus:ring-1 focus:ring-[var(--color-brand-500)]/40 resize-none"
      />
      {error && (
        <div className="text-[11px] text-red-300">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAdd}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Añadir tarjeta
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/5"
            aria-label="Cancelar"
          >
            <X size={14} />
          </button>
        </div>
        <button
          onClick={() => {
            handleClose();
            onExpand();
          }}
          className="text-[11px] text-white/55 hover:text-white inline-flex items-center gap-1"
          title="Abrir editor completo"
        >
          <Maximize2 size={11} /> Detalles
        </button>
      </div>
    </div>
  );
}
