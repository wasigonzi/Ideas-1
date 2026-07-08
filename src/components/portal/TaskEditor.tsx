"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Loader2, Save, Plus, Image as ImageIcon, Star, StarOff, Upload, Users, Search, MessageSquare, Activity, Send, Paperclip, AtSign, Play, Pause, CheckCircle, Clock, Timer, FileCheck, CheckSquare, Square, Printer } from "lucide-react";
import type { TaskCard } from "./TaskBoard";
import { MemberAvatar } from "./Avatar";
import { ApprovalSheet } from "./ApprovalSheet";

export type EditorUser = {
  id: string;
  name: string | null;
  email: string;
  role: string; // "admin" | "employee" | "client"
  avatar?: string | null;
  company?: string | null;
};

export type EditorOrder = {
  id: string;
  number: string;
  title: string;
  clientName: string;
};

type Mode = "create" | "edit";

const STATUS_OPTIONS = [
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "review", label: "En revisión" },
  { value: "produccion", label: "Producción" },
  { value: "blocked", label: "Bloqueada" },
  { value: "done", label: "Hecha" }
];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" }
];

export function TaskEditor({
  open,
  mode,
  task,
  defaultStatus,
  users,
  currentUserId,
  canEdit = true,
  orders,
  defaultOrderId,
  columns,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: Mode;
  task?: TaskCard | null;
  defaultStatus?: string;
  users: EditorUser[];
  currentUserId?: string;
  canEdit?: boolean;
  orders?: EditorOrder[];
  defaultOrderId?: string;
  columns?: { key: string; label: string }[];
  onClose: () => void;
  onSaved?: (updated: TaskCard) => void;
}) {
  const router = useRouter();
  const statusOptions = (columns && columns.length > 0)
    ? columns.map((c) => ({ value: c.key, label: c.label }))
    : STATUS_OPTIONS;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("normal");
  const [hours, setHours] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [orderId, setOrderId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Track the last (open, taskId) pair we initialised for, so that a
  // server re-render while the modal is already open (e.g. from realtime
  // fallback polling) does NOT reset the user's in-progress edits.
  const lastInitRef = useRef<{ open: boolean; taskId: string | null }>({
    open: false,
    taskId: null,
  });

  // Reset form whenever the editor opens for the first time, or opens for a
  // different task. Does NOT reset while the same task is already open.
  useEffect(() => {
    const currentTaskId = mode === "edit" && task ? task.id : null;
    const prev = lastInitRef.current;

    if (!open) {
      // Reset tracking when closed so the next open always re-initialises.
      lastInitRef.current = { open: false, taskId: null };
      return;
    }

    // Skip re-initialisation if the same task is still open.
    if (prev.open && prev.taskId === currentTaskId) return;

    lastInitRef.current = { open: true, taskId: currentTaskId };
    setError(null);
    if (mode === "edit" && task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setPriority(task.priority);
      setHours(task.hours);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
      setAttachments(task.attachments ?? []);
      setCoverImage(task.coverImage ?? "");
      // Merge primary assignee + members into one unified list (deduplicated).
      const primaryId = task.assigneeId ?? null;
      const memberList = (task.members ?? []).map((m) => m.id);
      const unified = primaryId
        ? [primaryId, ...memberList.filter((id) => id !== primaryId)]
        : memberList;
      setMemberIds(unified);
      setOrderId(task.orderId ?? "");
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus ?? "todo");
      setPriority("normal");
      setHours(0);
      setDueDate("");
      setAttachments([]);
      setCoverImage("");
      setMemberIds([]);
      setOrderId(defaultOrderId ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, task?.id, defaultStatus]);

  // Load approval status when editing a task
  useEffect(() => {
    if (!open || mode !== "edit" || !task) return;
    setApprovalStatus(null);
    fetch(`/api/tareas/${task.id}/hoja`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => s ? setApprovalStatus(s.status) : null)
      .catch(() => null);
  }, [open, mode, task]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSave() {
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      hours: Number(hours) || 0,
      dueDate: dueDate || null,
      assigneeId: memberIds[0] || null,
      attachments,
      coverImage: coverImage || null,
      members: memberIds,
      ...(mode === "create" && orderId ? { orderId } : {})
    };
    try {
      const url = mode === "create" ? "/api/tareas" : `/api/tareas/${task!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const info = await res.json().catch(() => null);
        throw new Error(info?.message || `Error al guardar (${res.status})`);
      }
      // Update the active task in the parent with fresh values so that
      // re-opening the modal before router.refresh() completes shows correct data.
      if (mode === "edit" && task && onSaved) {
        onSaved({
          ...task,
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          hours: Number(hours) || 0,
          dueDate: dueDate ? new Date(dueDate + "T00:00:00").toISOString() : null,
          assigneeId: memberIds[0] || null,
          coverImage: coverImage || null,
          attachments,
          members: memberIds
            .map((id) => users.find((u) => u.id === id))
            .filter((u): u is EditorUser => !!u)
            .map((u) => ({ id: u.id, name: u.name ?? u.email, avatar: u.avatar ?? null, role: u.role })),
        });
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tareas/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function handlePrint() {
    const statusLabel =
      statusOptions.find((o) => o.value === status)?.label ?? status;
    const priorityLabel =
      PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;
    const memberNames = memberIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => u!.name ?? u!.email)
      .join(", ");

    // Fetch checklist and comments in parallel (best-effort).
    let checkItems: { text: string; done: boolean }[] = [];
    let comments: { actor: string; createdAt: string; body: string }[] = [];

    if (task?.id) {
      const [clRes, cmRes] = await Promise.allSettled([
        fetch(`/api/tareas/${task.id}/checklist`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/tareas/${task.id}/comments`).then((r) => r.ok ? r.json() : null),
      ]);
      if (clRes.status === "fulfilled" && Array.isArray(clRes.value)) {
        checkItems = clRes.value;
      }
      if (cmRes.status === "fulfilled" && cmRes.value?.feed) {
        comments = (cmRes.value.feed as { kind: string; actor: { name: string }; createdAt: string; body: string }[])
          .filter((e) => e.kind === "comment")
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
          .map((e) => ({
            actor: e.actor?.name ?? "—",
            createdAt: new Date(e.createdAt).toLocaleString("es-PR"),
            body: e.body,
          }));
      }
    }

    const imagesHtml = attachments
      .map(
        (url) =>
          `<img src="${url}" style="max-width:100%;max-height:220px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />`
      )
      .join("\n");

    const checklistHtml =
      checkItems.length > 0
        ? `<section>
            <h2>Checklist</h2>
            <ul style="list-style:none;padding:0;margin:0;">
              ${checkItems
                .map(
                  (i) =>
                    `<li style="display:flex;align-items:center;gap:8px;padding:4px 0;${i.done ? "opacity:.55;" : ""}">
                      <span style="display:inline-block;width:14px;height:14px;border:2px solid #6b7280;border-radius:3px;background:${i.done ? "#22c55e" : "transparent"};flex-shrink:0;"></span>
                      <span style="${i.done ? "text-decoration:line-through;" : ""}">${escHtml(i.text)}</span>
                    </li>`
                )
                .join("")}
            </ul>
          </section>`
        : "";

    const commentsHtml =
      comments.length > 0
        ? `<section>
            <h2>Comentarios</h2>
            ${comments
              .map(
                (c) =>
                  `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:10px;">
                    <div style="font-weight:600;font-size:13px;">${escHtml(c.actor)} <span style="font-weight:400;color:#6b7280;font-size:12px;">&bull; ${c.createdAt}</span></div>
                    <div style="margin-top:6px;white-space:pre-wrap;font-size:13px;">${escHtml(c.body)}</div>
                  </div>`
              )
              .join("")}
          </section>`
        : "";

    const orderLine =
      task?.orderNumber
        ? `<div><strong>Orden:</strong> #${escHtml(task.orderNumber)}${task.clientName ? ` — ${escHtml(task.clientName)}` : ""}</div>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Tarea: ${escHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; font-size: 14px; color: #111; margin: 0; padding: 28px 36px; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #4b5563; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    section { margin-bottom: 18px; }
    .meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; }
    .meta strong { color: #374151; }
    .description { white-space: pre-wrap; font-size: 13px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
    .images { display: flex; flex-wrap: wrap; gap: 10px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .priority-urgent { background: #fef2f2; color: #dc2626; }
    .priority-high { background: #fff7ed; color: #ea580c; }
    .priority-normal { background: #eff6ff; color: #2563eb; }
    .priority-low { background: #f0fdf4; color: #16a34a; }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm 15mm 15mm 15mm; }
    }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h1>${escHtml(title)}</h1>
  ${orderLine}

  <div class="meta">
    <div><strong>Estado:</strong> ${escHtml(statusLabel)}</div>
    <div><strong>Prioridad:</strong> <span class="badge priority-${priority}">${escHtml(priorityLabel)}</span></div>
    <div><strong>Horas estimadas:</strong> ${hours}h</div>
    <div><strong>Fecha límite:</strong> ${dueDate ? new Date(dueDate + "T00:00:00").toLocaleDateString("es-PR") : "—"}</div>
    ${memberNames ? `<div style="grid-column:1/-1"><strong>Asignado a:</strong> ${escHtml(memberNames)}</div>` : ""}
  </div>

  ${description ? `<section><h2>Descripción</h2><div class="description">${escHtml(description)}</div></section>` : ""}

  ${attachments.length > 0 ? `<section><h2>Imágenes</h2><div class="images">${imagesHtml}</div></section>` : ""}

  ${checklistHtml}

  ${commentsHtml}

  <div class="footer">
    <span>IDEAS PR · Tarea impresa el ${new Date().toLocaleString("es-PR")}</span>
    ${task?.id ? `<span>ID: ${task.id}</span>` : ""}
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = () => win.print();
    // Fallback in case onload already fired.
    setTimeout(() => { if (!win.closed) win.print(); }, 600);
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok || !j.url) throw new Error(j.error || "upload failed");
        uploaded.push(j.url as string);
      }
      setAttachments((prev) => {
        const next = [...prev, ...uploaded];
        // First image becomes the cover automatically if none set yet.
        if (!coverImage && next.length > 0) setCoverImage(next[0]);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveAttachment(url: string) {
    setAttachments((prev) => prev.filter((u) => u !== url));
    if (coverImage === url) setCoverImage("");
  }

  function handleSetCover(url: string) {
    setCoverImage((prev) => (prev === url ? "" : url));
  }

  return (
    <>
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto z-[101] w-full sm:max-w-2xl sm:h-fit sm:max-h-[88vh] max-h-[92vh] overflow-y-auto bg-[var(--color-ink-900,#0a1322)] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col safe-pb"
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-[var(--color-ink-900,#0a1322)]/95 backdrop-blur">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] grid place-items-center shrink-0">
                  {mode === "create" ? <Plus size={16} /> : <Save size={16} />}
                </span>
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  {mode === "create" ? "Nueva tarea" : "Editar tarea"}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {mode === "edit" && task && (
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white"
                    aria-label="Imprimir tarea"
                    title="Imprimir tarea"
                  >
                    <Printer size={18} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 -m-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-5 py-5 space-y-4">
              <Field label="Título *">
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Diseñar mockup para el cliente X"
                  className={inputCls}
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalles, contexto, enlaces…"
                  className={`${inputCls} resize-y min-h-[80px]`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado">
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Prioridad">
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Horas estimadas">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value || "0"))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Fecha límite">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Asignado a">
                <MembersPicker
                  users={users}
                  value={memberIds}
                  onChange={setMemberIds}
                />
              </Field>

              <Field label="Imágenes / Portada">
                <div className="space-y-3">
                  {coverImage && (
                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImage} alt="Portada" className="w-full h-40 object-cover" />
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] px-2 py-0.5 rounded-full">
                        <Star size={10} /> Portada
                      </span>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {attachments.map((url) => {
                        const isCover = url === coverImage;
                        return (
                          <div
                            key={url}
                            className={`group relative aspect-square rounded-lg overflow-hidden border ${
                              isCover ? "border-[var(--color-brand-500)]" : "border-white/10"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleSetCover(url)}
                                className="p-1.5 rounded-md bg-white/10 hover:bg-[var(--color-brand-500)] hover:text-[var(--color-ink-950,#060b14)] text-white"
                                title={isCover ? "Quitar como portada" : "Usar como portada"}
                              >
                                {isCover ? <StarOff size={14} /> : <Star size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(url)}
                                className="p-1.5 rounded-md bg-white/10 hover:bg-red-500 text-white"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[var(--color-brand-500)]/50 hover:bg-[var(--color-brand-500)]/5 text-white/80 disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : attachments.length === 0 ? (
                        <Upload size={14} />
                      ) : (
                        <ImageIcon size={14} />
                      )}
                      {uploading
                        ? "Subiendo…"
                        : attachments.length === 0
                        ? "Subir imagen"
                        : "Añadir más imágenes"}
                    </button>
                    <p className="text-[11px] text-white/45 mt-1.5">
                      JPG, PNG, WEBP, AVIF o GIF · máx. 8 MB. Pasa el cursor sobre una imagen para
                      marcarla como portada o eliminarla.
                    </p>
                  </div>
                </div>
              </Field>

              {/* Checklist (only for existing tasks) */}
              {mode === "edit" && task?.id && (
                <ChecklistSection taskId={task.id} canEdit={canEdit} />
              )}

              {/* Employee time tracking (shown in task detail when canEdit=false) */}
              {!canEdit && mode === "edit" && task?.id && (
                <WorkTimerSection
                  taskId={task.id}
                  loggedSeconds={task.loggedSeconds ?? 0}
                  activeSession={task.activeSession ?? null}
                />
              )}

              {/* Trello-style comments & activity feed (only for existing tasks) */}
              {mode === "edit" && task?.id && (
                <CommentsActivity taskId={task.id} users={users} currentUserId={currentUserId} />
              )}

              {error && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-t border-white/10 bg-[var(--color-ink-900,#0a1322)]/95 backdrop-blur">
              {mode === "edit" ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200 px-3 py-2 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Eliminar
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                {mode === "edit" && task && (
                  <button
                    type="button"
                    onClick={() => setShowApproval(true)}
                    className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border border-[var(--color-brand-500)]/50 text-[var(--color-brand-400)] hover:bg-[var(--color-brand-500)]/10 transition-colors"
                  >
                    <FileCheck size={14} />
                    Hoja de aprobaci&#243;n
                    {approvalStatus === "approved" && <span className="w-2 h-2 rounded-full bg-green-400" title="Aprobado" />}
                    {approvalStatus === "changes_requested" && <span className="w-2 h-2 rounded-full bg-red-400" title="Cambios solicitados" />}
                    {approvalStatus === "pending" && <span className="w-2 h-2 rounded-full bg-yellow-400" title="Pendiente" />}
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={saving || deleting}
                  className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 text-white/70"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || deleting || !title.trim()}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {mode === "create" ? "Crear tarea" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Approval sheet — rendered outside the editor z-stack */}
    {mode === "edit" && task && (
      <ApprovalSheet
        open={showApproval}
        task={{
          id: task.id,
          title: task.title,
          attachments: task.attachments ?? [],
          orderNumber: task.orderNumber ?? undefined,
          clientName: task.clientName ?? undefined,
        }}
        onClose={() => setShowApproval(false)}
      />
    )}
    </>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-brand-500)]/60 focus:ring-1 focus:ring-[var(--color-brand-500)]/40";

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wider text-white/55 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trello-style members picker. Shows the chosen members as colored avatar
// chips with remove (x). A "+" button opens a popover with a search field and
// a list of all candidate users (employees, admins, clients) — clients are
// visually grouped at the bottom and tagged "Cliente".
// ─────────────────────────────────────────────────────────────────────────────
function MembersPicker({
  users,
  value,
  onChange
}: {
  users: EditorUser[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const popRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const selected = value
    .map((id) => userMap.get(id))
    .filter((u): u is EditorUser => !!u);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter((u) => {
      if (!q) return true;
      const roleLabel = u.role === "client" ? "cliente" : u.role === "employee" ? "empleado" : "admin";
      const hay = `${u.name ?? ""} ${u.email} ${u.company ?? ""} ${roleLabel}`.toLowerCase();
      return hay.includes(q);
    });
    // Sort: team first (admin/employee), then clients; alphabetical within each group.
    // Do NOT sort selected items to the top — stable order prevents list jumping
    // while the user is clicking multiple people.
    return list.sort((a, b) => {
      const ar = a.role === "client" ? 1 : 0;
      const br = b.role === "client" ? 1 : 0;
      if (ar !== br) return ar - br;
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    });
  }, [users, query, value]);

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  function remove(id: string) {
    onChange(value.filter((x) => x !== id));
  }

  return (
    <div className="relative" ref={popRef}>
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 && (
          <span className="text-xs text-white/40">Nadie asignado todavía.</span>
        )}
        {selected.map((u) => (
          <span
            key={u.id}
            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs"
          >
            <MemberAvatar
              id={u.id}
              name={u.name ?? u.email}
              avatar={u.avatar}
              size={20}
            />
            <span className="text-white/90 max-w-[140px] truncate">
              {u.name ?? u.email}
            </span>
            {u.role === "client" && (
              <span className="text-[9px] uppercase tracking-wider text-amber-300/90 font-semibold">
                Cliente
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(u.id)}
              className="text-white/45 hover:text-white"
              aria-label={`Quitar ${u.name ?? u.email}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-dashed border-white/20 hover:border-[var(--color-brand-500)]/60 hover:bg-[var(--color-brand-500)]/5 text-white/80"
        >
          <Users size={12} />
          {open ? "Cerrar" : "Etiquetar"}
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-2 left-0 w-full sm:w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-white/10 bg-[var(--color-ink-900,#0a1322)] shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
            <Search size={14} className="text-white/45" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empleado o cliente…"
              className="flex-1 bg-transparent outline-none text-sm placeholder-white/30"
            />
            {value.length > 0 && (
              <span className="shrink-0 text-[10px] font-semibold text-[var(--color-brand-400)] bg-[var(--color-brand-500)]/15 px-1.5 py-0.5 rounded-full">
                {value.length} ✓
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-white/45">
                Sin resultados.
              </div>
            )}
            {filtered.map((u, i) => {
              const isSelected = value.includes(u.id);
              const prev = filtered[i - 1];
              const showClientHeader =
                u.role === "client" && (!prev || prev.role !== "client");
              const showTeamHeader =
                u.role !== "client" && (!prev || prev.role === "client");
              return (
                <div key={u.id}>
                  {showTeamHeader && (
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-white/40">
                      Equipo
                    </div>
                  )}
                  {showClientHeader && (
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-white/40 border-t border-white/5 mt-1">
                      Clientes
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-white/5 ${
                      isSelected ? "bg-[var(--color-brand-500)]/10" : ""
                    }`}
                  >
                    <MemberAvatar
                      id={u.id}
                      name={u.name ?? u.email}
                      avatar={u.avatar}
                      size={26}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-white/90">
                        {u.name ?? u.email}
                      </span>
                      <span className="block truncate text-[11px] text-white/45">
                        {u.role === "client"
                          ? u.company ?? u.email
                          : u.email}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trello-style "Comments and activity" section. Loads the merged feed from
// /api/tareas/[id]/comments, lets the user post a new comment, and renders
// system activity entries (status, members, attachments, etc.) inline.
// ─────────────────────────────────────────────────────────────────────────────
type FeedActor = { id: string; name: string; avatar: string | null; role: string };
type FeedAttachment = { url: string; name?: string; type?: string; kind?: string };
type FeedEntry =
  | {
      kind: "comment";
      id: string;
      createdAt: string;
      actor: FeedActor;
      body: string;
      mentions: { id: string; name: string }[];
      attachments: FeedAttachment[];
    }
  | {
      kind: "activity";
      id: string;
      createdAt: string;
      actor: FeedActor;
      type: string;
      data: Record<string, unknown> | null;
      subjects: { id: string; name: string }[];
    };

export function CommentsActivity({
  taskId,
  users,
  currentUserId
}: {
  taskId: string;
  users: EditorUser[];
  currentUserId?: string;
}) {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [viewers, setViewers] = useState<{ userId: string; name: string | null; avatar: string | null; seenAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [draftAttachments, setDraftAttachments] = useState<FeedAttachment[]>([]);
  const [draftMentions, setDraftMentions] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // @-mention popover state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadFeed(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`/api/tareas/${taskId}/comments`, { cache: "no-store" });
      const j = await r.json();
      setFeed(Array.isArray(j.feed) ? j.feed : []);
      setViewers(Array.isArray(j.viewers) ? j.viewers : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        const [feedRes] = await Promise.all([
          fetch(`/api/tareas/${taskId}/comments`, { cache: "no-store" }),
          fetch(`/api/tareas/${taskId}/seen`, { method: "POST" }).catch(() => null)
        ]);
        const j = await feedRes.json();
        if (!cancelled) {
          setFeed(Array.isArray(j.feed) ? j.feed : []);
          setViewers(Array.isArray(j.viewers) ? j.viewers : []);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [taskId]);

  // Build the filtered list of mention candidates.
  const mentionMatches = useMemo(() => {
    if (!mentionOpen) return [];
    const q = mentionQuery.toLowerCase();
    return users
      .filter((u) => {
        const hay = `${u.name ?? ""} ${u.email}`.toLowerCase();
        return q === "" || hay.includes(q);
      })
      .slice(0, 6);
  }, [users, mentionOpen, mentionQuery]);

  function handleDraftChange(value: string, caret: number) {
    setDraft(value);
    const upToCaret = value.slice(0, caret);
    const match = /(?:^|\s)@([\p{L}\p{N}._-]*)$/u.exec(upToCaret);
    if (match) {
      const start = caret - match[1].length - 1;
      setMentionOpen(true);
      setMentionQuery(match[1]);
      setMentionStart(start);
      setMentionIndex(0);
    } else {
      setMentionOpen(false);
      setMentionStart(null);
      setMentionQuery("");
    }
  }

  function insertMention(u: EditorUser) {
    if (mentionStart == null || !textareaRef.current) return;
    const display = (u.name ?? u.email).replace(/\s+/g, "\u00a0");
    const before = draft.slice(0, mentionStart);
    const afterStart = mentionStart + 1 + mentionQuery.length;
    const after = draft.slice(afterStart);
    const insert = `@${display} `;
    const next = before + insert + after;
    setDraft(next);
    setDraftMentions((prev) => (prev.includes(u.id) ? prev : [...prev, u.id]));
    setMentionOpen(false);
    setMentionStart(null);
    setMentionQuery("");
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = before.length + insert.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      const uploaded: FeedAttachment[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok || !j.url) throw new Error(j.error || "upload failed");
        uploaded.push({
          url: j.url,
          name: j.name ?? file.name,
          type: j.type ?? file.type,
          kind: j.kind ?? (file.type.startsWith("image/") ? "image" : "file")
        });
      }
      setDraftAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      /* ignore */
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeDraftAttachment(url: string) {
    setDraftAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  async function postComment() {
    const body = draft.trim();
    if ((!body && draftAttachments.length === 0) || posting) return;
    setPosting(true);
    try {
      const stillMentioned = draftMentions.filter((id) => {
        const u = users.find((x) => x.id === id);
        if (!u) return false;
        const display = (u.name ?? u.email).replace(/\s+/g, "\u00a0");
        return body.includes(`@${display}`);
      });
      const r = await fetch(`/api/tareas/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachments: draftAttachments, mentions: stillMentioned })
      });
      if (!r.ok) throw new Error("post failed");
      setDraft("");
      setDraftAttachments([]);
      setDraftMentions([]);
      await loadFeed(true);
    } catch {
      /* ignore */
    } finally {
      setPosting(false);
    }
  }

  function startEdit(e: Extract<FeedEntry, { kind: "comment" }>) {
    setEditingId(e.id);
    setEditDraft(e.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit(commentId: string) {
    const body = editDraft.trim();
    if (!body || editSaving) return;
    setEditSaving(true);
    try {
      const r = await fetch(`/api/tareas/${taskId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (!r.ok) throw new Error("edit failed");
      setEditingId(null);
      setEditDraft("");
      await loadFeed(true);
    } catch {
      /* ignore */
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    try {
      await fetch(`/api/tareas/${taskId}/comments/${commentId}`, { method: "DELETE" });
      await loadFeed(true);
    } catch {
      /* ignore */
    }
  }

  // Newest first for display.
  const sorted = [...feed].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
  const visible = showActivity ? sorted : sorted.filter((e) => e.kind === "comment");

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/85 flex items-center gap-2">
          <MessageSquare size={14} className="text-white/55" />
          Comentarios y actividad
        </h3>
        <button
          type="button"
          onClick={() => setShowActivity((v) => !v)}
          className="text-[11px] font-medium px-2 py-1 rounded hover:bg-white/5 text-white/65"
        >
          {showActivity ? "Ocultar detalles" : "Mostrar detalles"}
        </button>
      </div>

      {/* New comment composer */}
      <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] focus-within:border-[var(--color-brand-500)]/50">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value, e.target.selectionStart ?? 0)}
            onKeyDown={(e) => {
              if (mentionOpen && mentionMatches.length > 0) {
                if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionMatches.length); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length); return; }
                if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionMatches[mentionIndex]); return; }
                if (e.key === "Escape") { e.preventDefault(); setMentionOpen(false); return; }
              }
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); postComment(); }
            }}
            placeholder="Escribe un comentario… usa @ para mencionar (Ctrl/Cmd + Enter para enviar)"
            rows={3}
            className="w-full bg-transparent border-0 outline-none px-3 py-2 text-sm text-white placeholder-white/30 resize-none"
          />
          {mentionOpen && mentionMatches.length > 0 && (
            <div className="absolute z-30 left-2 bottom-full mb-1 w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-white/10 bg-[var(--color-ink-900,#0a1322)] shadow-2xl overflow-hidden">
              {mentionMatches.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                  onMouseEnter={() => setMentionIndex(i)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-sm ${i === mentionIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <MemberAvatar id={u.id} name={u.name ?? u.email} avatar={u.avatar} size={22} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-white/90">{u.name ?? u.email}</span>
                    <span className="block truncate text-[11px] text-white/45">{u.role === "client" ? u.company ?? u.email : u.email}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {draftAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {draftAttachments.map((a) => (
              <DraftAttachmentChip key={a.url} attachment={a} onRemove={() => removeDraftAttachment(a.url)} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} title="Adjuntar archivo o imagen" className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded hover:bg-white/5 text-white/70">
              {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
              Adjuntar
            </button>
            <input ref={fileInputRef} type="file" hidden multiple onChange={(e) => handleUpload(e.target.files)} />
            <button type="button" onClick={() => { const ta = textareaRef.current; if (!ta) return; const pos = ta.selectionStart ?? draft.length; const prefix = pos > 0 && !/\s/.test(draft[pos - 1] ?? "") ? " " : ""; const next = draft.slice(0, pos) + prefix + "@" + draft.slice(pos); setDraft(next); requestAnimationFrame(() => { ta.focus(); const newPos = pos + prefix.length + 1; ta.setSelectionRange(newPos, newPos); handleDraftChange(next, newPos); }); }} title="Mencionar" className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded hover:bg-white/5 text-white/70">
              <Users size={14} /> Mencionar
            </button>
          </div>
          <button type="button" onClick={postComment} disabled={posting || (!draft.trim() && draftAttachments.length === 0)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-white/45 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" /> Cargando…
        </div>
      ) : visible.length === 0 ? (
        <div className="text-xs text-white/40 text-center py-6 border border-dashed border-white/10 rounded-lg">
          Aún no hay comentarios ni actividad.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((e) =>
            e.kind === "comment" ? (
              <li key={e.id} className="flex gap-2.5 group/comment">
                <MemberAvatar id={e.actor.id} name={e.actor.name} avatar={e.actor.avatar} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white/90">{e.actor.name}</span>
                    <span className="text-[11px] text-white/40">{formatRelative(e.createdAt)}</span>
                    {(e as { editedAt?: string }).editedAt && (
                      <span className="text-[10px] text-white/30 italic">editado</span>
                    )}
                    {/* Edit / Delete — only shown for own comments */}
                    {currentUserId && e.actor.id === currentUserId && editingId !== e.id && (
                      <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(e)}
                          className="p-1 rounded hover:bg-white/8 text-white/40 hover:text-white/80"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteComment(e.id)}
                          className="p-1 rounded hover:bg-red-500/15 text-white/40 hover:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                  {editingId === e.id ? (
                    <div className="mt-1 rounded-lg border border-[var(--color-brand-500)]/40 bg-white/5 overflow-hidden">
                      <textarea
                        autoFocus
                        value={editDraft}
                        onChange={(ev) => setEditDraft(ev.target.value)}
                        onKeyDown={(ev) => {
                          if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") { ev.preventDefault(); saveEdit(e.id); }
                          if (ev.key === "Escape") { ev.preventDefault(); cancelEdit(); }
                        }}
                        rows={3}
                        className="w-full bg-transparent outline-none px-3 py-2 text-sm text-white resize-none"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
                        <button type="button" onClick={() => saveEdit(e.id)} disabled={editSaving || !editDraft.trim()} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] hover:brightness-110 disabled:opacity-50">
                          {editSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                          Guardar
                        </button>
                        <button type="button" onClick={cancelEdit} className="text-xs text-white/55 hover:text-white px-2 py-1.5">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    (e.body || e.attachments.length > 0) && (
                      <div className="mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/85">
                        {e.body && (
                          <div className="whitespace-pre-wrap break-words">
                            {renderBodyWithMentions(e.body, e.mentions)}
                          </div>
                        )}
                        {e.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {e.attachments.map((a) => (
                              <CommentAttachment key={a.url} attachment={a} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </li>
            ) : (
              <li key={e.id} className="flex gap-2.5 items-start">
                <MemberAvatar id={e.actor.id} name={e.actor.name} avatar={e.actor.avatar} size={22} />
                <div className="flex-1 min-w-0 text-[12px] text-white/55 leading-relaxed pt-0.5">
                  <span className="font-semibold text-white/75">{e.actor.name}</span>{" "}
                  {describeActivity(e)}
                  <span className="text-white/35"> · {formatRelative(e.createdAt)}</span>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {/* Seen by */}
      {viewers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/6 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Visto por</span>
          <div className="flex items-center -space-x-1.5">
            {viewers.slice(0, 6).map((v) => (
              <span key={v.userId} title={v.name ?? "Usuario"}>
                <MemberAvatar id={v.userId} name={v.name ?? "?"} avatar={v.avatar} size={20} />
              </span>
            ))}
          </div>
          <span className="text-[11px] text-white/35">
            {viewers.slice(0, 3).map((v) => v.name ?? "Usuario").join(", ")}
            {viewers.length > 3 ? ` y ${viewers.length - 3} más` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function describeActivity(
  e: Extract<FeedEntry, { kind: "activity" }>
): React.ReactNode {
  const d = e.data ?? {};
  const subjects = e.subjects;
  switch (e.type) {
    case "status_changed":
      return (
        <>
          movió esta tarjeta de <em className="not-italic text-white/75">{statusLabel(String(d.from))}</em>{" "}
          a <em className="not-italic text-white/75">{statusLabel(String(d.to))}</em>.
        </>
      );
    case "priority_changed":
      return (
        <>
          cambió la prioridad a{" "}
          <em className="not-italic text-white/75">{priorityLabel(String(d.to))}</em>.
        </>
      );
    case "title_changed":
      return <>renombró la tarjeta a <em className="not-italic text-white/75">“{String(d.to)}”</em>.</>;
    case "assignee_changed":
      return d.to ? (
        <>asignó la tarjeta a <em className="not-italic text-white/75">{String(d.to)}</em>.</>
      ) : (
        <>quitó la asignación.</>
      );
    case "due_changed":
      return d.to ? (
        <>cambió la fecha límite a {new Date(String(d.to)).toLocaleString()}.</>
      ) : (
        <>quitó la fecha límite.</>
      );
    case "members_added":
      return <>agregó a {subjects.map((s) => s.name).join(", ")}.</>;
    case "members_removed":
      return <>quitó a {subjects.map((s) => s.name).join(", ")}.</>;
    case "attachments_added":
      return <>agregó {(Array.isArray(d.urls) ? d.urls.length : 0)} adjunto(s).</>;
    case "attachments_removed":
      return <>eliminó {(Array.isArray(d.urls) ? d.urls.length : 0)} adjunto(s).</>;
    case "cover_changed":
      return d.to ? <>actualizó la portada.</> : <>quitó la portada.</>;
    default:
      return <>{e.type}</>;
  }
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    todo: "Por hacer",
    in_progress: "En progreso",
    blocked: "Bloqueada",
    done: "Hecha",
    review: "Para revisi\u00f3n",
    produccion: "Producci\u00f3n",
    // New Trello workflow columns:
    pendientes:    "Jobs Pendientes",
    espera:        "En Espera",
    arte:          "Arte / Dise\u00f1o",
    terminaciones: "Terminaciones",
    instalacion:   "Instalaci\u00f3n",
    facturar:      "Facturar",
    cerrado:       "Cerrado",
  };
  return map[s] ?? s;
}
function priorityLabel(p: string): string {
  const map: Record<string, string> = {
    low: "Baja",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente"
  };
  return map[p] ?? p;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "ahora mismo";
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `hace ${day} d`;
  return date.toLocaleDateString();
}

// Render comment body, highlighting any "@Name" tokens that match a known
// mention. Names are matched using non-breaking space tokens (we replace
// spaces with U+00A0 when inserting a mention) so multi-word names stay
// together.
function renderBodyWithMentions(
  body: string,
  mentions: { id: string; name: string }[]
): React.ReactNode {
  if (mentions.length === 0) return body;
  const tokens = mentions.map((m) => `@${m.name.replace(/\s+/g, "\u00a0")}`);
  // Build a regex that matches any of the mention tokens.
  const escaped = tokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length); // longest first
  if (escaped.length === 0) return body;
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = body.split(re);
  return parts.map((p, i) =>
    tokens.includes(p) ? (
      <span
        key={i}
        className="inline-block px-1 rounded bg-[var(--color-brand-500)]/15 text-[var(--color-brand-300,#fcd49b)] font-semibold"
      >
        {p.replace(/\u00a0/g, " ")}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

// Render an attachment chip below a comment. Images get a thumbnail link;
// other files show a generic file pill with the filename.
function CommentAttachment({ attachment }: { attachment: FeedAttachment }) {
  const isImage =
    attachment.kind === "image" ||
    (attachment.type ?? "").startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|avif)$/i.test(attachment.url);
  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block w-24 h-24 rounded-md overflow-hidden border border-white/10 hover:border-[var(--color-brand-500)]/60"
        title={attachment.name ?? "Adjunto"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name ?? ""}
          className="w-full h-full object-cover bg-black/30"
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-white/10 bg-white/5 hover:border-[var(--color-brand-500)]/60 text-xs text-white/85 max-w-full"
      title={attachment.name ?? attachment.url}
    >
      <Paperclip size={12} className="shrink-0" />
      <span className="truncate">{attachment.name ?? attachment.url.split("/").pop()}</span>
    </a>
  );
}

// Compact preview chip used inside the composer for pending uploads.
function DraftAttachmentChip({
  attachment,
  onRemove
}: {
  attachment: FeedAttachment;
  onRemove: () => void;
}) {
  const isImage =
    attachment.kind === "image" ||
    (attachment.type ?? "").startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|avif)$/i.test(attachment.url);
  return (
    <span className="relative group inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md border border-white/10 bg-white/5 text-xs text-white/85 max-w-[220px]">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt=""
          className="w-6 h-6 rounded object-cover"
        />
      ) : (
        <Paperclip size={12} />
      )}
      <span className="truncate">{attachment.name ?? attachment.url.split("/").pop()}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-white/55 hover:text-white p-0.5"
        aria-label="Quitar adjunto"
      >
        <X size={12} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkTimerSection — shown inside the task modal for employees (canEdit=false).
// Displays total time logged and lets the employee start / pause / submit for
// review using the work-start / work-stop API endpoints.
// ─────────────────────────────────────────────────────────────────────────────
function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`
    : `${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

function WorkTimerSection({
  taskId,
  loggedSeconds,
  activeSession: initialSession,
}: {
  taskId: string;
  loggedSeconds: number;
  activeSession: { id: string; startedAt: string } | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [elapsed, setElapsed] = useState<number>(() => {
    if (!initialSession) return 0;
    return Math.floor((Date.now() - new Date(initialSession.startedAt).getTime()) / 1000);
  });
  const [loading, setLoading] = useState<"start" | "pause" | "review" | null>(null);
  const [totalLogged, setTotalLogged] = useState(loggedSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inventory reporting state
  const [inventory, setInventory] = useState<{ id: string; name: string; unit: string; category: string }[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [materialQty, setMaterialQty] = useState("");

  useEffect(() => {
    fetch("/api/inventario")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInventory(data.filter((x) => x.active));
        }
      })
      .catch(() => {});
  }, []);

  // Live tick when session is active
  useEffect(() => {
    if (session) {
      const start = new Date(session.startedAt).getTime();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  async function handleStart() {
    setLoading("start");
    try {
      const res = await fetch(`/api/tareas/${taskId}/work-start`, { method: "POST" });
      if (!res.ok) throw new Error("start failed");
      const data = await res.json();
      setSession({ id: data.session.id, startedAt: data.session.startedAt });
    } catch {
      // silent — keep UI stable
    } finally {
      setLoading(null);
    }
  }

  async function handleStop(submitForReview: boolean) {
    setLoading(submitForReview ? "review" : "pause");
    try {
      const res = await fetch(`/api/tareas/${taskId}/work-stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitForReview,
          materialId: materialId || null,
          materialQty: materialQty ? parseFloat(materialQty) : 0
        }),
      });
      if (!res.ok) {
        const info = await res.json().catch(() => null);
        if (info?.message) alert(info.message);
        throw new Error(info?.message || "stop failed");
      }
      const data = await res.json();
      setTotalLogged((prev) => prev + (data.elapsedSeconds ?? 0));
      setSession(null);
      setMaterialId("");
      setMaterialQty("");
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Timer size={15} className="text-[var(--color-brand-400)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
          Control de tiempo
        </span>
      </div>

      {/* Total logged */}
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Clock size={13} className="shrink-0" />
        <span>
          Tiempo registrado:{" "}
          <span className="font-semibold text-white">{fmtSeconds(totalLogged)}</span>
        </span>
      </div>

      {session ? (
        /* Active session — show live timer + stop options */
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/30 px-3 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-400)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-brand-500)]" />
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--color-brand-300)]">
              {fmtSeconds(elapsed)}
            </span>
            <span className="text-xs text-white/50 ml-auto">Sesión activa</span>
          </div>

          {/* Material consumption inputs */}
          {inventory.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-2">
              <label className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">
                Registrar consumo de insumos (opcional)
              </label>
              <div className="grid grid-cols-[1.5fr_1fr] gap-2">
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="select text-xs py-1.5 h-auto bg-[var(--color-ink-850)] border-white/10"
                >
                  <option value="">Seleccionar material...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cant."
                    value={materialQty}
                    onChange={(e) => setMaterialQty(e.target.value)}
                    className="input text-xs py-1.5 h-auto bg-[var(--color-ink-850)] border-white/10 w-full"
                  />
                  {materialId && (
                    <span className="text-[10px] text-white/50 shrink-0">
                      {inventory.find((x) => x.id === materialId)?.unit ?? ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!!loading}
              onClick={() => handleStop(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 disabled:opacity-50"
            >
              {loading === "pause" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Pause size={14} />
              )}
              Pausar
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => handleStop(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 disabled:opacity-50"
            >
              {loading === "review" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              Para aprobación
            </button>
          </div>
        </div>
      ) : (
        /* No active session — show start button */
        <button
          type="button"
          disabled={!!loading}
          onClick={handleStart}
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[var(--color-brand-500)]/15 border border-[var(--color-brand-500)]/40 hover:bg-[var(--color-brand-500)]/25 text-[var(--color-brand-300)] disabled:opacity-50"
        >
          {loading === "start" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} className="fill-current" />
          )}
          Comenzar trabajo
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checklist section — shows a list of to-do items inside a task with checkboxes.
// ─────────────────────────────────────────────────────────────────────────────
type CheckItem = { id: string; text: string; done: boolean; position: number };

function ChecklistSection({ taskId, canEdit }: { taskId: string; canEdit: boolean }) {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetch(`/api/tareas/${taskId}/checklist`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: CheckItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => null);
  }, [taskId]);

  async function toggleItem(item: CheckItem) {
    const updated = { ...item, done: !item.done };
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
    await fetch(`/api/tareas/${taskId}/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: updated.done }),
    }).catch(() => null);
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/tareas/${taskId}/checklist/${id}`, { method: "DELETE" }).catch(() => null);
  }

  async function addItem() {
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/tareas/${taskId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const item: CheckItem = await res.json();
        setItems((prev) => [...prev, item]);
        setNewText("");
        setShowInput(false);
      }
    } catch { /* ignore */ } finally {
      setAdding(false);
    }
  }

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-white/55 flex items-center gap-1.5">
          <CheckSquare size={12} /> Checklist
          {items.length > 0 && (
            <span className="text-white/40 font-normal normal-case tracking-normal">
              {done}/{items.length}
            </span>
          )}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className="text-xs text-white/40 hover:text-white"
          >
            {showInput ? "Cancelar" : "+ Añadir"}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mb-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <button
              type="button"
              onClick={() => toggleItem(item)}
              className="mt-0.5 shrink-0 text-white/50 hover:text-white"
              aria-label={item.done ? "Desmarcar" : "Marcar como hecho"}
            >
              {item.done
                ? <CheckSquare size={15} className="text-emerald-400" />
                : <Square size={15} />}
            </button>
            <span className={`flex-1 text-sm ${item.done ? "line-through text-white/35" : "text-white/85"}`}>
              {item.text}
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
                aria-label="Eliminar"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {showInput && (
        <div className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            placeholder="Nuevo ítem…"
            maxLength={500}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-brand-500)]/60"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={adding || !newText.trim()}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950,#060b14)] text-xs font-bold disabled:opacity-50"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : "Añadir"}
          </button>
        </div>
      )}
    </div>
  );
}
