"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Plus, Trash2, X } from "lucide-react";

export type BoardItem = { id: string; status: string; position?: number };
export type BoardColumn = { key: string; label: string; accent?: string | null };

const POS_STEP = 1000;

function computePosition(list: { position?: number }[], insertIndex: number): number {
  // `list` already reflects the new order including the moved item at `insertIndex`.
  const prev = insertIndex > 0 ? list[insertIndex - 1] : null;
  const next = insertIndex < list.length - 1 ? list[insertIndex + 1] : null;
  const prevPos = prev?.position;
  const nextPos = next?.position;

  if (prevPos == null && nextPos == null) return POS_STEP;
  if (prevPos == null && nextPos != null) return nextPos - POS_STEP;
  if (prevPos != null && nextPos == null) return prevPos + POS_STEP;
  return ((prevPos as number) + (nextPos as number)) / 2;
}

export function TrelloBoard<T extends BoardItem>({
  initialItems,
  columns,
  endpoint,
  renderCard,
  onCardClick,
  renderColumnFooter,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn
}: {
  initialItems: T[];
  columns: BoardColumn[];
  endpoint: (id: string) => string;
  renderCard: (item: T) => React.ReactNode;
  onCardClick?: (item: T) => void;
  renderColumnFooter?: (col: BoardColumn) => React.ReactNode;
  onAddColumn?: (label: string) => Promise<void>;
  onUpdateColumn?: (key: string, patch: { label?: string; accent?: string | null }) => Promise<void>;
  onDeleteColumn?: (key: string) => Promise<void>;
}) {
  const [items, setItems] = useState<T[]>(initialItems);

  // Re-sync when parent provides new data (e.g. router.refresh()).
  // Include coverImage and attachments in the sig so cover/attachment edits
  // are reflected without a status/position change.
  const sig = initialItems.map((i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = i as any;
    const cover: string = any.coverImage ?? "";
    const attachLen: number = (any.attachments as string[] | undefined)?.length ?? 0;
    return `${i.id}:${i.status}:${i.position ?? ""}:${cover}:${attachLen}`;
  }).join("|");
  const [lastSig, setLastSig] = useState(sig);
  if (sig !== lastSig) {
    setLastSig(sig);
    setItems(initialItems);
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mobileCol, setMobileCol] = useState<string>(columns[0]?.key ?? "");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // @dnd-kit uses a global counter for `aria-describedby` IDs which causes
  // hydration mismatches when other DndContexts mount before this one. Use a
  // stable React id so SSR and client agree.
  const dndId = useId();

  const preDragRef = useRef<T[] | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, T[]> = {};
    const knownKeys = new Set(columns.map((c) => c.key));
    const fallbackKey = columns[0]?.key ?? "";
    for (const c of columns) g[c.key] = [];
    for (const i of items) {
      const key = knownKeys.has(i.status) ? i.status : fallbackKey;
      (g[key] ??= []).push(i);
    }
    return g;
  }, [items, columns]);

  function findContainer(id: string): string | null {
    if (columns.some((c) => c.key === id)) return id;
    const item = items.find((i) => i.id === id);
    return item ? item.status : null;
  }

  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    const intersections = rectIntersection(args);
    if (intersections.length > 0) return intersections;
    return closestCorners(args);
  };

  function handleDragStart(e: DragStartEvent) {
    preDragRef.current = items;
    setActiveId(String(e.active.id));
  }

  // Live cross-column move.
  function handleDragOver(e: DragOverEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    setItems((prev) => {
      const activeIdx = prev.findIndex((i) => i.id === activeIdStr);
      if (activeIdx === -1) return prev;
      const next = prev.slice();
      const [moved] = next.splice(activeIdx, 1);
      const updated = { ...moved, status: overContainer } as T;

      let insertAt: number;
      if (overId === overContainer) {
        // Hovering the column itself (empty area) → append to end of target column.
        let lastIdx = -1;
        for (let i = 0; i < next.length; i++) {
          if (next[i].status === overContainer) lastIdx = i;
        }
        insertAt = lastIdx === -1 ? next.length : lastIdx + 1;
      } else {
        const overIdx = next.findIndex((i) => i.id === overId);
        insertAt = overIdx === -1 ? next.length : overIdx;
      }
      next.splice(insertAt, 0, updated);
      return next;
    });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActiveId(null);

    if (!overId) {
      if (preDragRef.current) setItems(preDragRef.current);
      preDragRef.current = null;
      return;
    }

    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer) {
      if (preDragRef.current) setItems(preDragRef.current);
      preDragRef.current = null;
      return;
    }

    // Intra-column reorder.
    let workingItems = items;
    if (activeContainer === overContainer && activeIdStr !== overId) {
      const colItems = grouped[activeContainer] ?? [];
      const fromIdx = colItems.findIndex((i) => i.id === activeIdStr);
      const toIdx =
        overId === overContainer
          ? colItems.length - 1
          : colItems.findIndex((i) => i.id === overId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const reorderedCol = arrayMove(colItems, fromIdx, toIdx);
        // Rebuild flat items: keep other columns in original order, replace this column.
        const colKeySet = new Set(reorderedCol.map((i) => i.id));
        const others = items.filter((i) => !colKeySet.has(i.id));
        workingItems = [...others, ...reorderedCol];
        setItems(workingItems);
      }
    }

    // Recompute grouped from the working list to get the moved item's final index.
    const finalGrouped: Record<string, T[]> = {};
    for (const c of columns) finalGrouped[c.key] = [];
    for (const i of workingItems) (finalGrouped[i.status] ??= []).push(i);

    const targetCol = overContainer;
    const colList = finalGrouped[targetCol] ?? [];
    const finalIdx = colList.findIndex((i) => i.id === activeIdStr);
    if (finalIdx === -1) {
      preDragRef.current = null;
      return;
    }

    const original = preDragRef.current?.find((i) => i.id === activeIdStr);
    const moved = colList[finalIdx];
    const newPosition = computePosition(colList, finalIdx);

    const statusChanged = original?.status !== moved.status;
    const positionChanged = (original?.position ?? null) !== newPosition;

    if (!statusChanged && !positionChanged) {
      preDragRef.current = null;
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === activeIdStr ? ({ ...i, position: newPosition } as T) : i))
    );

    const preSnapshot = preDragRef.current;
    preDragRef.current = null;
    setSavingId(activeIdStr);
    try {
      const res = await fetch(endpoint(activeIdStr), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: moved.status, position: newPosition })
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      if (preSnapshot) setItems(preSnapshot);
      alert("No se pudo guardar el cambio. Intenta de nuevo.");
    } finally {
      setSavingId(null);
    }
  }

  function handleDragCancel() {
    if (preDragRef.current) setItems(preDragRef.current);
    preDragRef.current = null;
    setActiveId(null);
  }

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* ─── MOBILE: status tab strip ─── */}
      <div className="md:hidden -mx-4 sm:-mx-5 px-4 sm:px-5 mb-3 overflow-x-auto no-scrollbar">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10">
          {columns.map((col) => {
            const count = (grouped[col.key] ?? []).length;
            const active = mobileCol === col.key;
            return (
              <button
                key={col.key}
                onClick={() => setMobileCol(col.key)}
                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  active
                    ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {col.accent && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${col.accent} ${active ? "opacity-80" : ""}`}
                  />
                )}
                {col.label}
                <span
                  className={`text-[10px] px-1.5 rounded-full ${active ? "bg-black/15" : "bg-white/10"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── COLUMNS ─── */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4 items-start">
        {columns.map((col) => (
          <div key={col.key} className="min-w-[275px] w-[275px] shrink-0">
              <Column
                col={col}
                items={grouped[col.key] ?? []}
                renderCard={renderCard}
                savingId={savingId}
                onCardClick={onCardClick}
                footer={renderColumnFooter?.(col)}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
              />
            </div>
          ))}
        {onAddColumn && (
          <div className="min-w-[180px] shrink-0">
            <AddColumnTile onAdd={onAddColumn} />
          </div>
        )}
      </div>

      {/* ─── MOBILE: single active column ─── */}
      <div className="md:hidden">
        {columns.map((col) => {
          if (mobileCol !== col.key) return null;
          return (
            <Column
              key={col.key}
              col={col}
              items={grouped[col.key] ?? []}
              renderCard={renderCard}
              savingId={savingId}
              onCardClick={onCardClick}
              footer={renderColumnFooter?.(col)}
              onUpdateColumn={onUpdateColumn}
              onDeleteColumn={onDeleteColumn}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="rotate-2 scale-[1.02] shadow-2xl shadow-black/50">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<T extends BoardItem>({
  col,
  items,
  renderCard,
  savingId,
  onCardClick,
  footer,
  onUpdateColumn,
  onDeleteColumn
}: {
  col: BoardColumn;
  items: T[];
  renderCard: (i: T) => React.ReactNode;
  savingId: string | null;
  onCardClick?: (i: T) => void;
  footer?: React.ReactNode;
  onUpdateColumn?: (key: string, patch: { label?: string; accent?: string | null }) => Promise<void>;
  onDeleteColumn?: (key: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`group rounded-2xl border bg-[#1d2329]/80 transition flex flex-col overflow-hidden h-[calc(100vh-13rem)] ${
        isOver
          ? "border-[var(--color-brand-500)]/60"
          : "border-white/5"
      }`}
    >
      {/* Trello-style colored top bar */}
      {col.accent && <div className={`h-1.5 w-full ${col.accent}`} />}
      <div className="px-3 sm:px-4 pt-3 pb-3 flex flex-col flex-1 min-h-0">
      <div className="hidden md:flex items-center justify-between mb-3 gap-2">
        <h3 className="font-semibold text-sm text-white/90 truncate">
          {col.label}
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {items.length}
          </span>
          {(onUpdateColumn || onDeleteColumn) && (
            <ColumnMenu
              col={col}
              onUpdateColumn={onUpdateColumn}
              onDeleteColumn={onDeleteColumn}
            />
          )}
        </div>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-0.5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}
        >
          {items.map((item) => (
            <Card
              key={item.id}
              item={item}
              renderCard={renderCard}
              saving={savingId === item.id}
              onClick={onCardClick}
            />
          ))}
          {items.length === 0 && (
            <div className="text-xs text-white/40 text-center py-10 border border-dashed border-white/10 rounded-xl">
              Soltar aquí
            </div>
          )}
        </div>
      </SortableContext>
      {footer && <div className="mt-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

function Card<T extends BoardItem>({
  item,
  renderCard,
  saving,
  onClick
}: {
  item: T;
  renderCard: (i: T) => React.ReactNode;
  saving: boolean;
  onClick?: (i: T) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  const downRef = useRef<{ x: number; y: number; t: number } | null>(null);
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => {
        downRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      }}
      onPointerUp={(e) => {
        const start = downRef.current;
        downRef.current = null;
        if (!onClick || !start) return;
        const dx = Math.abs(e.clientX - start.x);
        const dy = Math.abs(e.clientY - start.y);
        const dt = Date.now() - start.t;
        if (dx < 5 && dy < 5 && dt < 300) onClick(item);
      }}
      className={`cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-30" : ""
      } ${saving ? "ring-1 ring-[var(--color-brand-500)]/60" : ""}`}
    >
      {renderCard(item)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column header gear menu (rename / change color / delete).
// ─────────────────────────────────────────────────────────────────────────────
const COLUMN_ACCENTS: { value: string; label: string; swatch: string }[] = [
  { value: "bg-amber-500", label: "Ámbar", swatch: "bg-amber-500" },
  { value: "bg-orange-500", label: "Naranja", swatch: "bg-orange-500" },
  { value: "bg-rose-500", label: "Rosa", swatch: "bg-rose-500" },
  { value: "bg-red-500", label: "Rojo", swatch: "bg-red-500" },
  { value: "bg-violet-500", label: "Violeta", swatch: "bg-violet-500" },
  { value: "bg-fuchsia-500", label: "Fucsia", swatch: "bg-fuchsia-500" },
  { value: "bg-indigo-500", label: "Índigo", swatch: "bg-indigo-500" },
  { value: "bg-sky-500", label: "Cielo", swatch: "bg-sky-500" },
  { value: "bg-cyan-500", label: "Cian", swatch: "bg-cyan-500" },
  { value: "bg-emerald-500", label: "Esmeralda", swatch: "bg-emerald-500" },
  { value: "bg-lime-500", label: "Lima", swatch: "bg-lime-500" },
  { value: "bg-slate-500", label: "Pizarra", swatch: "bg-slate-500" }
];

function ColumnMenu({
  col,
  onUpdateColumn,
  onDeleteColumn
}: {
  col: BoardColumn;
  onUpdateColumn?: (key: string, patch: { label?: string; accent?: string | null }) => Promise<void>;
  onDeleteColumn?: (key: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(col.label);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // Re-sync editable label when the column prop changes (after refresh).
  const lastSig = useRef(col.label);
  if (lastSig.current !== col.label) {
    lastSig.current = col.label;
    setLabel(col.label);
  }

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function saveLabel() {
    if (!onUpdateColumn) return;
    const v = label.trim();
    if (!v || v === col.label) return;
    setBusy(true);
    setError(null);
    try {
      await onUpdateColumn(col.key, { label: v });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function setAccent(value: string) {
    if (!onUpdateColumn) return;
    setBusy(true);
    setError(null);
    try {
      await onUpdateColumn(col.key, { accent: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!onDeleteColumn) return;
    if (!confirm(`¿Eliminar la lista "${col.label}"? Las tarjetas se moverán a la primera lista.`))
      return;
    setBusy(true);
    setError(null);
    try {
      await onDeleteColumn(col.key);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-white/45 hover:text-white p-1 rounded hover:bg-white/10"
        aria-label="Opciones de lista"
        title="Opciones"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 rounded-xl border border-white/10 bg-[#1d2329] shadow-2xl shadow-black/60 p-3 space-y-3">
          {onUpdateColumn && (
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                Nombre
              </label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveLabel();
                    }
                  }}
                  disabled={busy}
                  className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand-500)]/60"
                />
                <button
                  type="button"
                  onClick={saveLabel}
                  disabled={busy || !label.trim() || label.trim() === col.label}
                  className="text-xs px-2 py-1.5 rounded-md bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] font-semibold disabled:opacity-40"
                >
                  OK
                </button>
              </div>
            </div>
          )}
          {onUpdateColumn && (
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                Color
              </label>
              <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                {COLUMN_ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAccent(a.value)}
                    disabled={busy}
                    title={a.label}
                    className={`h-6 rounded ${a.swatch} ${
                      col.accent === a.value
                        ? "ring-2 ring-white/80"
                        : "ring-1 ring-white/10 hover:ring-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          {onDeleteColumn && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-rose-500/40 text-rose-300 hover:bg-rose-500/15 disabled:opacity-50"
            >
              <Trash2 size={12} /> Eliminar lista
            </button>
          )}
          {error && <div className="text-[11px] text-red-300">{error}</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Add another list" tile rendered after the last column (admin only).
// ─────────────────────────────────────────────────────────────────────────────
function AddColumnTile({ onAdd }: { onAdd: (label: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function start() {
    setOpen(true);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }
  function cancel() {
    setOpen(false);
    setLabel("");
    setError(null);
  }
  async function submit() {
    const v = label.trim();
    if (!v) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(v);
      setLabel("");
      // Keep composer open Trello-style for adding multiple in a row.
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        className="w-full min-h-[120px] flex items-center justify-center gap-2 text-sm font-medium text-white/70 hover:text-white border border-dashed border-white/15 hover:border-[var(--color-brand-500)]/50 hover:bg-white/[0.04] rounded-2xl py-4 transition"
      >
        <Plus size={16} /> Añadir otra lista
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1d2329]/80 border border-white/10 p-3 space-y-2">
      <input
        ref={inputRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        placeholder="Introduce el título de la lista…"
        className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--color-brand-500)]/60"
      />
      {error && <div className="text-[11px] text-red-300">{error}</div>}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !label.trim()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] hover:brightness-110 disabled:opacity-50"
        >
          Añadir lista
        </button>
        <button
          type="button"
          onClick={cancel}
          className="text-white/55 hover:text-white p-1.5"
          aria-label="Cancelar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
