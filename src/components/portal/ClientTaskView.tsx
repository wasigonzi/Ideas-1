"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  FileCheck,
  CheckCircle2,
  MessageSquareDiff,
  Loader2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import type { SheetData } from "./ApprovalSheet";
import { ApprovalDocument, DOC_W, DOC_H } from "./ApprovalSheet";

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
  checklist?: { id: string; text: string; done: boolean }[];
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
  return t.dueDate && t.status !== "done" && t.status !== "cerrado" && new Date(t.dueDate) < new Date();
}

const STATUS_LABEL: Record<string, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "Para revisión",
  produccion: "Producción",
  blocked: "Bloqueada",
  done: "Hecha",  // New Trello workflow columns:
  pendientes:    "Jobs Pendientes",
  espera:        "En Espera",
  arte:          "Arte / Dise\u00f1o",
  terminaciones: "Terminaciones",
  instalacion:   "Instalaci\u00f3n / Entrega",
  facturar:      "Facturar",
  cerrado:       "Cerrado / Cobrado",};

export function ClientTaskView({ tasks, currentUserId }: { tasks: ClientTask[]; currentUserId?: string }) {
  const router = useRouter();
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

            {/* Checklist progress (read-only for client) */}
            {selected.checklist && selected.checklist.length > 0 && (
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ClipboardList size={15} className="text-white/55" />
                    Lista de verificación
                  </div>
                  <span className="text-xs text-white/50 font-semibold">
                    {selected.checklist.filter((c) => c.done).length} / {selected.checklist.length}
                  </span>
                </div>
                <ProgressBar
                  value={selected.checklist.filter((c) => c.done).length}
                  max={selected.checklist.length}
                />
                <ul className="space-y-1.5 pt-1">
                  {selected.checklist.map((c) => (
                    <li key={c.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        size={15}
                        className={`mt-0.5 shrink-0 ${c.done ? "text-green-400" : "text-white/20"}`}
                      />
                      <span className={c.done ? "text-white/70 line-through" : "text-white/60"}>
                        {c.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Approval Sheet */}
            <ApprovalSheetPanel
              taskId={selected.id}
              taskStatus={selected.status}
              onRespond={(approvalStatus) => {
                const newTaskStatus = approvalStatus === "approved" ? "produccion" : "espera";
                setSelected((prev) => prev ? { ...prev, status: newTaskStatus } : prev);
                router.refresh();
              }}
            />

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

// ── Approval Sheet Panel (client view) ──────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:           { label: "Pendiente de aprobacion", cls: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10" },
  approved:          { label: "Aprobado",                cls: "text-green-300  border-green-500/40  bg-green-500/10"  },
  changes_requested: { label: "Cambios solicitados",     cls: "text-red-300    border-red-500/40    bg-red-500/10"    },
};

interface SheetState {
  status: string;
  clientNote: string | null;
  data: SheetData;
}

function ApprovalSheetPanel({ taskId, taskStatus, onRespond }: { taskId: string; taskStatus?: string; onRespond?: (status: "approved" | "changes_requested") => void }) {
  const [sheet, setSheet] = useState<SheetState | null | undefined>(undefined); // undefined = not loaded yet
  // Auto-expand when the task is waiting for client approval
  const [expanded, setExpanded] = useState(taskStatus === "review");
  const [responding, setResponding] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const panRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [panning, setPanning] = useState(false);

  function onPanDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = panRef.current;
    if (!el) return;
    // Solo iniciar pan si hay contenido desbordado (la hoja está ampliada).
    if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
    panState.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    setPanning(true);
  }

  function onPanMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = panRef.current;
    const p = panState.current;
    if (!el || !p) return;
    el.scrollLeft = p.left - (e.clientX - p.x);
    el.scrollTop = p.top - (e.clientY - p.y);
  }

  function onPanUp() {
    panState.current = null;
    setPanning(false);
  }

  // Zoom con Ctrl + rueda del mouse (listener no pasivo para poder bloquear
  // el zoom del navegador). Hace zoom hacia la posición del cursor.
  useEffect(() => {
    const el = panRef.current;
    if (!zoomOpen || !el) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const container = panRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Posición del cursor relativa al contenido (incluye el scroll actual).
      const px = e.clientX - rect.left + container.scrollLeft;
      const py = e.clientY - rect.top + container.scrollTop;
      setZoom((prev) => {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const next = Math.min(3, Math.max(0.4, Math.round(prev * factor * 100) / 100));
        if (next === prev) return prev;
        const ratio = next / prev;
        // Reposicionar el scroll para mantener el punto bajo el cursor.
        requestAnimationFrame(() => {
          const c = panRef.current;
          if (!c) return;
          c.scrollLeft = px * ratio - (e.clientX - rect.left);
          c.scrollTop = py * ratio - (e.clientY - rect.top);
        });
        return next;
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomOpen]);

  async function load() {
    if (sheet !== undefined) return;
    const res = await fetch(`/api/tareas/${taskId}/hoja`);
    if (!res.ok) { setSheet(null); return; }
    const data = await res.json();
    setSheet(data);
  }

  // If auto-expanded (review status), load the sheet immediately on mount
  useEffect(() => {
    if (taskStatus === "review") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(status: "approved" | "changes_requested") {
    if (status === "changes_requested" && !note.trim()) {
      setShowNoteBox(true);
      return;
    }
    setResponding(true);
    try {
      const res = await fetch(`/api/tareas/${taskId}/hoja/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, clientNote: note.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSheet(updated);
      setShowNoteBox(false);
      setNote("");
      onRespond?.(status);
    } catch {
      alert("Error al enviar respuesta");
    } finally {
      setResponding(false);
    }
  }

  // Lazy-load when expanded
  function toggle() {
    if (!expanded) load();
    setExpanded((v) => !v);
  }

  if (sheet === null) return null; // no sheet exists

  const meta = sheet ? STATUS_META[sheet.status] : null;

  return (
    <>
    <div className="card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/4 transition-colors"
      >
        <span className="w-8 h-8 rounded-lg bg-[#ffae00]/15 text-[#ffae00] grid place-items-center shrink-0">
          <FileCheck size={16} />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-sm font-semibold">Hoja de Aprobacion</span>
          {meta && (
            <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 ${meta.cls}`}>
              {meta.label}
            </span>
          )}
          {sheet === undefined && (
            <span className="text-xs text-white/40">Verificando...</span>
          )}
        </span>
        <ChevronRight size={14} className={`text-white/30 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {sheet === undefined && (
              <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-white/40" /></div>
            )}

            {sheet && (
              <div className="px-4 pb-5 space-y-4 border-t border-white/8">
                {/* Status + client note */}
                {sheet.status === "changes_requested" && sheet.clientNote && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-200">
                    <span className="font-bold block mb-1">Tu solicitud de cambios:</span>
                    {sheet.clientNote}
                  </div>
                )}
                {sheet.status === "approved" && (
                  <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-200 flex items-center gap-2">
                    <CheckCircle2 size={15} /> Has aprobado esta hoja.
                  </div>
                )}

                {/* Document preview (all pages) */}
                <div className="space-y-2">
                  <button
                    onClick={() => { setZoom(1); setZoomOpen(true); }}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Maximize2 size={13} /> Ampliar y dar zoom
                  </button>
                  <button
                    type="button"
                    onClick={() => { setZoom(1); setZoomOpen(true); }}
                    className="block w-full overflow-x-auto cursor-zoom-in"
                    title="Clic para ampliar"
                  >
                    {sheet.data.pages?.map((page, idx) => (
                      <div key={page.id ?? idx} className="mb-4">
                        {sheet.data.pages.length > 1 && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-1 text-left">Pagina {idx + 1}</p>
                        )}
                        <div className="overflow-hidden rounded-lg border border-white/10" style={{ transform: "scale(0.5)", transformOrigin: "top left", width: DOC_W, height: DOC_H, marginBottom: `-${Math.round(DOC_H * 0.5)}px`, marginRight: `-${Math.round(DOC_W * 0.5)}px` }}>
                          <ApprovalDocument
                            numero={sheet.data.numero}
                            cliente={sheet.data.cliente}
                            fecha={sheet.data.fecha}
                            material={sheet.data.material}
                            terminacion={sheet.data.terminacion}
                            nota={sheet.data.nota}
                            page={page}
                            taskTitle=""
                          />
                        </div>
                      </div>
                    ))}
                  </button>
                </div>

                {/* Actions — only if still pending */}
                {sheet.status === "pending" && (
                  <div className="space-y-3 pt-2">
                    {showNoteBox && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/60">Describe los cambios que necesitas:</p>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          placeholder="Ej. Cambiar el color del texto a rojo..."
                          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-400/50"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => respond("approved")}
                        disabled={responding}
                        className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
                      >
                        {responding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Aprobar
                      </button>
                      <button
                        onClick={() => {
                          if (!showNoteBox) { setShowNoteBox(true); return; }
                          respond("changes_requested");
                        }}
                        disabled={responding}
                        className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {responding ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareDiff size={14} />}
                        Pedir cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Zoom modal — fullscreen preview with controls and approve/changes actions */}
    <AnimatePresence>
      {zoomOpen && sheet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col"
          onClick={() => setZoomOpen(false)}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0a0f1a]/80 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <FileCheck size={18} className="text-[#ffae00] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Hoja de Aprobacion</p>
              {meta && (
                <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 ${meta.cls}`}>
                  {meta.label}
                </span>
              )}
            </div>
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.2) * 10) / 10))}
                className="w-8 h-8 grid place-items-center rounded-md hover:bg-white/10 text-white/70"
                title="Reducir"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-semibold text-white/60 w-12 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.2) * 10) / 10))}
                className="w-8 h-8 grid place-items-center rounded-md hover:bg-white/10 text-white/70"
                title="Ampliar"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-2 h-8 grid place-items-center rounded-md hover:bg-white/10 text-white/60 text-xs font-semibold"
                title="Restablecer"
              >
                100%
              </button>
            </div>
            <button
              onClick={() => setZoomOpen(false)}
              className="w-9 h-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable / zoomable document area */}
          <div
            ref={panRef}
            className={`flex-1 overflow-auto p-6 flex justify-center items-start ${panning ? "cursor-grabbing" : "cursor-grab"}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onPanDown}
            onPointerMove={onPanMove}
            onPointerUp={onPanUp}
            onPointerLeave={onPanUp}
          >
            <div className="space-y-6" style={{ width: DOC_W * zoom }}>
              {sheet.data.pages?.map((page, idx) => (
                <div key={page.id ?? idx}>
                  {sheet.data.pages.length > 1 && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Pagina {idx + 1}</p>
                  )}
                  <div
                    className="overflow-hidden rounded-lg shadow-2xl"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: DOC_W, height: `${Math.round(DOC_H * zoom)}px` }}
                  >
                    <ApprovalDocument
                      numero={sheet.data.numero}
                      cliente={sheet.data.cliente}
                      fecha={sheet.data.fecha}
                      material={sheet.data.material}
                      terminacion={sheet.data.terminacion}
                      nota={sheet.data.nota}
                      page={page}
                      taskTitle=""
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions — only if still pending */}
          {sheet.status === "pending" && (
            <div
              className="border-t border-white/10 bg-[#0a0f1a]/80 p-4 shrink-0 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              {showNoteBox && (
                <div className="space-y-2 max-w-2xl mx-auto">
                  <p className="text-xs text-white/60">Describe los cambios que necesitas:</p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Ej. Cambiar el color del texto a rojo..."
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-400/50"
                  />
                </div>
              )}
              <div className="flex gap-2 max-w-2xl mx-auto">
                <button
                  onClick={() => respond("approved")}
                  disabled={responding}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
                >
                  {responding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Aprobar
                </button>
                <button
                  onClick={() => {
                    if (!showNoteBox) { setShowNoteBox(true); return; }
                    respond("changes_requested");
                  }}
                  disabled={responding}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                >
                  {responding ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareDiff size={14} />}
                  Pedir cambios
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
