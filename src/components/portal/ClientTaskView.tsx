"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import type { SheetData } from "./ApprovalSheet";

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
  review: "Para revisión",
  produccion: "Producción",
  blocked: "Bloqueada",
  done: "Hecha",
};

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

            {/* Approval Sheet */}
            <ApprovalSheetPanel
              taskId={selected.id}
              taskStatus={selected.status}
              onRespond={(approvalStatus) => {
                const newTaskStatus = approvalStatus === "approved" ? "produccion" : "in_progress";
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

const DOC_W = 816;
const IMG_AREA_H = 460;
const LOGO_URL = "https://static.showit.co/1200/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png";

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
                <div className="overflow-x-auto">
                  {sheet.data.pages?.map((page, idx) => (
                    <div key={page.id ?? idx} className="mb-4">
                      {sheet.data.pages.length > 1 && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-1">Pagina {idx + 1}</p>
                      )}
                      <div className="overflow-hidden rounded-lg border border-white/10" style={{ transform: "scale(0.6)", transformOrigin: "top left", width: DOC_W, marginBottom: `-${Math.round(736 * 0.4)}px` }}>
                        <ClientDocPreview data={sheet.data} page={page} />
                      </div>
                    </div>
                  ))}
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
  );
}

function ClientDocPreview({ data, page }: { data: SheetData; page: SheetData["pages"][0] }) {
  return (
    <div style={{ width: DOC_W, background: "#fff", color: "#000", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", padding: "24px 28px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "2px solid #000" }}>
        <div style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRight: "2px solid #000" }}>
          <div style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "2px" }}>HOJA DE APROBACION</div>
        </div>
        <div style={{ width: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700 }}>No:</div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#c00" }}>{data.numero || "____"}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", border: "2px solid #000", borderTop: "none" }}>
        <div style={{ width: "130px", borderRight: "2px solid #000", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Ideas" style={{ width: "100px", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 12px", gap: "2px 20px" }}>
          {[["Cliente", data.cliente], ["Material", data.material], ["Fecha", data.fecha], ["Terminacion", data.terminacion]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", gap: "6px", paddingBottom: "2px", borderBottom: "1px solid #ccc" }}>
              <span style={{ fontWeight: 700, fontSize: "11px" }}>{l}:</span>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{v || "\u00a0"}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ border: "2px solid #000", borderTop: "none", display: "flex", alignItems: "center", padding: "6px 12px", marginBottom: "12px", background: "#f0f0f0" }}>
        <span style={{ fontWeight: 900, fontSize: "13px", marginRight: "10px", background: "#333", color: "#fff", padding: "2px 8px", borderRadius: "3px" }}>NOTA:</span>
        <span style={{ fontWeight: 700, fontSize: "13px" }}>{data.nota}</span>
      </div>
      <div style={{ border: "2px solid #ccc", borderRadius: "16px", overflow: "hidden", height: IMG_AREA_H, position: "relative", background: "#f8f8f8" }}>
        {page.images?.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt="Arte" draggable={false}
            style={{ position: "absolute", left: `${img.x}%`, top: `${img.y}%`, transform: `translate(-50%,-50%) scale(${img.scale})`, maxWidth: "none", touchAction: "none" }}
          />
        ))}
        {(!page.images || page.images.length === 0) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: "14px" }}>Sin imagen</div>
        )}
      </div>
    </div>
  );
}
