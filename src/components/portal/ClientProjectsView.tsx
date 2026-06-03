"use client";

import { useEffect, useState } from "react";
import { Check, MessageSquare, FolderKanban, Clock, FileImage } from "lucide-react";

type Project = {
  id: string;
  number: string;
  title: string;
  stage: string;
  stageLabel: string;
  stageAccent: string | null;
  progress: number;
  dueDate: string | null;
  quoted: number;
  pendingApprovals: number;
  tasks: number;
};

type Approval = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  files: string[];
  status: string;
  clientNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  project: { number: string; title: string } | null;
};

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("es-PR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function ClientProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<Approval | null>(null);

  async function load() {
    setLoading(true);
    const [p, a] = await Promise.all([
      fetch("/api/cliente/proyectos"),
      fetch("/api/cliente/aprobaciones"),
    ]);
    if (p.ok) setProjects((await p.json()).projects ?? []);
    setApprovals(a.ok ? await a.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="heading-lg">Mis proyectos</h1>
        <p className="text-white/50 text-sm mt-1">
          Sigue el estado de tus trabajos y aprueba diseños o cotizaciones.
        </p>
      </header>

      {/* Aprobaciones pendientes */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare size={16} /> Pendientes de tu aprobación
            <span className="text-xs bg-amber-500/20 text-amber-300 rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {pending.map((a) => (
              <div key={a.id} className="card p-4 border border-amber-500/30">
                <div className="text-[11px] uppercase tracking-wide text-amber-300">
                  {a.type === "quote" ? "Cotización" : "Diseño / arte"}
                </div>
                <div className="font-semibold text-sm mt-1">{a.title}</div>
                {a.project && (
                  <div className="text-xs text-white/50 mt-0.5">
                    #{a.project.number} · {a.project.title}
                  </div>
                )}
                {a.description && (
                  <p className="text-sm text-white/65 mt-2">{a.description}</p>
                )}
                {a.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {a.files.map((f, i) => (
                      <a key={i} href={f} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">
                        <FileImage size={13} /> Ver archivo {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary w-full mt-4 text-sm" onClick={() => setResponding(a)}>
                  Revisar y responder
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de proyectos */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <FolderKanban size={16} /> Proyectos activos
        </h2>
        {loading ? (
          <p className="text-white/50 text-sm">Cargando...</p>
        ) : projects.length === 0 ? (
          <p className="text-white/50 text-sm">No tienes proyectos activos por el momento.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-[var(--color-brand-400)]">#{p.number}</div>
                    <div className="font-semibold truncate">{p.title}</div>
                  </div>
                  {p.pendingApprovals > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 rounded-full px-2 py-0.5 whitespace-nowrap">
                      {p.pendingApprovals} por aprobar
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.stageAccent ?? "bg-slate-500"}`} />
                  <span className="text-sm text-white/75">{p.stageLabel}</span>
                </div>

                <div className="mt-2">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[var(--color-brand-500,#3b82f6)]" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="text-[11px] text-white/45 mt-1">{p.progress}% del flujo</div>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> Entrega: {fmtDate(p.dueDate)}
                  </span>
                  <span>{p.tasks} tareas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial de aprobaciones resueltas */}
      {approvals.some((a) => a.status !== "pending") && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm">Historial de aprobaciones</h2>
          <ul className="space-y-1 text-sm">
            {approvals.filter((a) => a.status !== "pending").map((a) => (
              <li key={a.id} className="flex items-center justify-between text-white/65">
                <span>{a.title}</span>
                <span className={a.status === "approved" ? "text-emerald-400" : "text-amber-400"}>
                  {a.status === "approved" ? "Aprobado" : "Cambios pedidos"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {responding && (
        <RespondModal
          approval={responding}
          onClose={() => setResponding(null)}
          onDone={() => { setResponding(null); load(); }}
        />
      )}
    </div>
  );
}

function RespondModal({
  approval, onClose, onDone,
}: {
  approval: Approval;
  onClose: () => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function respond(decision: "approved" | "changes") {
    if (decision === "changes" && !note.trim()) {
      alert("Por favor describe los cambios que necesitas.");
      return;
    }
    setSaving(true);
    const r = await fetch(`/api/cliente/aprobaciones/${approval.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note || null }),
    });
    setSaving(false);
    if (!r.ok) { alert("Error al enviar tu respuesta"); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="heading-md mb-1">{approval.title}</h2>
        {approval.project && (
          <p className="text-xs text-white/50 mb-4">#{approval.project.number} · {approval.project.title}</p>
        )}
        {approval.description && (
          <p className="text-sm text-white/70 mb-4">{approval.description}</p>
        )}
        {approval.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {approval.files.map((f, i) => (
              <a key={i} href={f} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">
                <FileImage size={13} /> Archivo {i + 1}
              </a>
            ))}
          </div>
        )}
        <label className="text-sm font-medium block mb-1">Comentario (requerido si pides cambios)</label>
        <textarea rows={3} className="textarea w-full" value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escribe aquí cualquier cambio o comentario..." />
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={() => respond("changes")} disabled={saving}>
            <MessageSquare size={15} /> Pedir cambios
          </button>
          <button className="btn btn-primary" onClick={() => respond("approved")} disabled={saving}>
            <Check size={15} /> Aprobar
          </button>
        </div>
      </div>
    </div>
  );
}
