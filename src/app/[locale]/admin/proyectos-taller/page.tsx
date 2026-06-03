"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowRight, X, Check, ImagePlus, DollarSign } from "lucide-react";

type Stage = { key: string; label: string; accent: string | null };

type Member = { user: { id: string; name: string | null; avatar: string | null } };
type Project = {
  id: string;
  number: string;
  estimateNumber: string | null;
  title: string;
  stage: string;
  priority: string;
  quoted: number;
  dueDate: string | null;
  clientName: string | null;
  client: { id: string; name: string | null } | null;
  members: Member[];
  _count: { tasks: number; documents: number };
};

type CreateForm = {
  number: string;
  estimateNumber: string;
  title: string;
  description: string;
  priority: string;
  clientName: string;
  quoted: number;
};

const emptyCreate: CreateForm = {
  number: "",
  estimateNumber: "",
  title: "",
  description: "",
  priority: "normal",
  clientName: "",
  quoted: 0,
};

export default function ProyectosBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<CreateForm | null>(null);
  const [moving, setMoving] = useState<Project | null>(null);
  const [costing, setCosting] = useState<Project | null>(null);
  const [approving, setApproving] = useState<Project | null>(null);

  async function load() {
    setLoading(true);
    const [s, p] = await Promise.all([
      fetch("/api/work-projects/stages"),
      fetch("/api/work-projects"),
    ]);
    setStages(s.ok ? await s.json() : []);
    setProjects(p.ok ? await p.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!creating) return;
    if (!creating.title.trim()) { alert("El título es obligatorio"); return; }
    const r = await fetch("/api/work-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creating),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.error === "number_taken" ? "Ese número de proyecto ya existe" : "Error al crear");
      return;
    }
    setCreating(null); load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar proyecto?")) return;
    await fetch(`/api/work-projects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg">Proyectos</h1>
          <p className="text-sm text-white/55 mt-1">
            El centro de la operación. Cada etapa avanza solo con foto y checklist.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating({ ...emptyCreate })}>
          <Plus size={16} /> Nuevo proyecto
        </button>
      </div>

      {loading ? (
        <p className="text-white/55 mt-8">Cargando...</p>
      ) : (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const inStage = projects.filter((p) => p.stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[280px] w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.accent ?? "bg-slate-500"}`} />
                  <h2 className="font-semibold text-sm">{stage.label}</h2>
                  <span className="text-xs text-white/45">{inStage.length}</span>
                </div>
                <div className="space-y-3">
                  {inStage.map((p) => (
                    <div key={p.id} className="card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-[var(--color-brand-400)]">#{p.number}</div>
                          <div className="font-semibold text-sm truncate">{p.title}</div>
                        </div>
                        <button className="text-red-500/70 hover:text-red-500" onClick={() => remove(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="text-xs text-white/55 mt-1 truncate">
                        {p.client?.name ?? p.clientName ?? "Sin cliente"}
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-white/45">
                        <span>${p.quoted.toFixed(0)}</span>
                        <span>{p._count.tasks} tareas · {p._count.documents} docs</span>
                      </div>
                      <button
                        className="btn btn-outline w-full mt-3 text-xs"
                        onClick={() => setMoving(p)}
                      >
                        Mover etapa <ArrowRight size={13} />
                      </button>
                      <button
                        className="btn btn-outline w-full mt-2 text-xs"
                        onClick={() => setCosting(p)}
                      >
                        Costo / ficha <DollarSign size={13} />
                      </button>
                      <button
                        className="btn btn-outline w-full mt-2 text-xs"
                        onClick={() => setApproving(p)}
                      >
                        Pedir aprobación <Check size={13} />
                      </button>
                    </div>
                  ))}
                  {inStage.length === 0 && (
                    <p className="text-xs text-white/30 italic px-1">Vacío</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <CreateModal
          form={creating}
          setForm={setCreating}
          onCancel={() => setCreating(null)}
          onSave={create}
        />
      )}

      {moving && (
        <MoveModal
          project={moving}
          stages={stages}
          onClose={() => setMoving(null)}
          onMoved={() => { setMoving(null); load(); }}
        />
      )}

      {costing && (
        <CostModal
          project={costing}
          onClose={() => setCosting(null)}
          onSaved={() => load()}
        />
      )}

      {approving && (
        <ApprovalRequestModal
          project={approving}
          onClose={() => setApproving(null)}
          onDone={() => setApproving(null)}
        />
      )}
    </div>
  );
}

function CreateModal({
  form, setForm, onCancel, onSave,
}: {
  form: CreateForm;
  setForm: (f: CreateForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onCancel}>
      <div className="card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="heading-md mb-5">Nuevo proyecto</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Número del estimado">
            <input className="input" placeholder="ej. 2451" value={form.estimateNumber} onChange={(e) => setForm({ ...form, estimateNumber: e.target.value })} />
          </Field>
          <Field label="Número de proyecto (opcional)">
            <input className="input" placeholder="se deriva del estimado" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </Field>
          <Field label="Título" full>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Cliente">
            <input className="input" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          </Field>
          <Field label="Prioridad">
            <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </Field>
          <Field label="Monto cotizado ($)">
            <input type="number" min="0" step="0.01" className="input" value={form.quoted} onChange={(e) => setForm({ ...form, quoted: Number(e.target.value) })} />
          </Field>
          <Field label="Descripción / instrucciones" full>
            <textarea rows={3} className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave}>Crear</button>
        </div>
      </div>
    </div>
  );
}

function MoveModal({
  project, stages, onClose, onMoved,
}: {
  project: Project;
  stages: Stage[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const [toStage, setToStage] = useState(() => {
    const idx = stages.findIndex((s) => s.key === project.stage);
    return stages[idx + 1]?.key ?? project.stage;
  });
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newItem, setNewItem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.url) { alert("Error al subir foto"); return; }
      setPhotos((prev) => [...prev, data.url]);
    } finally {
      setUploading(false);
    }
  }

  function addItem() {
    if (!newItem.trim()) return;
    setChecklist((prev) => [...prev, { text: newItem.trim(), done: false }]);
    setNewItem("");
  }

  async function submit() {
    if (photos.length === 0) { alert("Sube al menos una foto de evidencia."); return; }
    if (checklist.length === 0) { alert("Agrega al menos un item al checklist."); return; }
    if (checklist.some((c) => !c.done)) { alert("Completa todos los items del checklist."); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/work-projects/${project.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, note, photos, checklist }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert(d.message ?? "No se pudo mover el proyecto");
        return;
      }
      onMoved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="heading-md">Mover proyecto</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-white/50 mb-5">#{project.number} — {project.title}</p>

        <Field label="Mover a etapa">
          <select className="select" value={toStage} onChange={(e) => setToStage(e.target.value)}>
            {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Fotos de evidencia <span className="text-red-400">*</span></label>
            <label className={`btn btn-outline text-xs cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <ImagePlus size={13} /> {uploading ? "Subiendo..." : "Agregar"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]); e.target.value = ""; }} />
            </label>
          </div>
          {photos.length === 0 ? (
            <p className="text-xs text-white/40 italic">Requerido: al menos una foto.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-0.5">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium block mb-2">Checklist <span className="text-red-400">*</span></label>
          <div className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="ej. Calidad revisada" value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }} />
            <button className="btn btn-outline" onClick={addItem}><Plus size={14} /></button>
          </div>
          {checklist.length === 0 ? (
            <p className="text-xs text-white/40 italic">Requerido: agrega y completa items.</p>
          ) : (
            <ul className="space-y-1">
              {checklist.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setChecklist((prev) => prev.map((x, idx) => idx === i ? { ...x, done: !x.done } : x))}
                    className={`w-5 h-5 rounded grid place-items-center border ${c.done ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/30"}`}>
                    {c.done && <Check size={13} />}
                  </button>
                  <span className={c.done ? "line-through text-white/45" : ""}>{c.text}</span>
                  <button className="ml-auto text-red-500/60 hover:text-red-500"
                    onClick={() => setChecklist((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field label="Nota (opcional)">
          <textarea rows={2} className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Moviendo..." : "Confirmar y mover"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

type CostReport = {
  laborHours: number;
  laborCost: number;
  laborByUser: { userId: string; name: string | null; hours: number; rate: number; cost: number }[];
  quoted: number;
  materialCost: number;
  inkCost: number;
  otherCost: number;
  totalCost: number;
  margin: number;
  marginPct: number | null;
};

type SheetForm = {
  materialName: string;
  printType: string;
  rip: string;
  machine: string;
  materialQty: number;
  materialCost: number;
  inkCost: number;
  otherCost: number;
  notes: string;
};

const emptySheet: SheetForm = {
  materialName: "", printType: "", rip: "", machine: "",
  materialQty: 0, materialCost: 0, inkCost: 0, otherCost: 0, notes: "",
};

const fmtMoney = (n: number) => `$${n.toFixed(2)}`;

function CostModal({
  project, onClose, onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [report, setReport] = useState<CostReport | null>(null);
  const [sheet, setSheet] = useState<SheetForm>(emptySheet);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [r, s] = await Promise.all([
      fetch(`/api/work-projects/${project.id}/costo`),
      fetch(`/api/work-projects/${project.id}/ficha`),
    ]);
    setReport(r.ok ? await r.json() : null);
    if (s.ok) {
      const data = await s.json();
      if (data) {
        setSheet({
          materialName: data.materialName ?? "",
          printType: data.printType ?? "",
          rip: data.rip ?? "",
          machine: data.machine ?? "",
          materialQty: data.materialQty ?? 0,
          materialCost: data.materialCost ?? 0,
          inkCost: data.inkCost ?? 0,
          otherCost: data.otherCost ?? 0,
          notes: data.notes ?? "",
        });
      }
    }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function saveSheet() {
    setSaving(true);
    const r = await fetch(`/api/work-projects/${project.id}/ficha`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheet),
    });
    setSaving(false);
    if (!r.ok) { alert("Error al guardar la ficha"); return; }
    await load();
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="heading-md">#{project.number} · Costo vs. facturación</h2>
          <button className="text-white/50 hover:text-white" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <p className="text-white/55">Cargando...</p>
        ) : (
          <>
            {/* Reporte costo vs facturación */}
            {report && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="card p-4 space-y-2 text-sm">
                  <h3 className="font-semibold mb-1">Costo real</h3>
                  <Line label={`Mano de obra (${report.laborHours.toFixed(1)} h)`} value={fmtMoney(report.laborCost)} />
                  <Line label="Material" value={fmtMoney(report.materialCost)} />
                  <Line label="Tinta" value={fmtMoney(report.inkCost)} />
                  <Line label="Otros" value={fmtMoney(report.otherCost)} />
                  <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                    <span>Total costo</span><span>{fmtMoney(report.totalCost)}</span>
                  </div>
                </div>
                <div className="card p-4 space-y-2 text-sm">
                  <h3 className="font-semibold mb-1">Resultado</h3>
                  <Line label="Facturado / cotizado" value={fmtMoney(report.quoted)} />
                  <Line label="Costo total" value={fmtMoney(report.totalCost)} />
                  <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                    <span>Margen</span>
                    <span className={report.margin >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {fmtMoney(report.margin)}
                      {report.marginPct != null && ` (${(report.marginPct * 100).toFixed(0)}%)`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {report && report.laborByUser.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-2">Horas por colaborador</h3>
                <ul className="space-y-1 text-sm text-white/70">
                  {report.laborByUser.map((u) => (
                    <li key={u.userId} className="flex justify-between">
                      <span>{u.name ?? "—"} · {u.hours.toFixed(1)} h × {fmtMoney(u.rate)}</span>
                      <span>{fmtMoney(u.cost)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ficha técnica */}
            <h3 className="font-semibold text-sm mb-3">Ficha técnica de cierre</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Material">
                <input className="input" value={sheet.materialName} onChange={(e) => setSheet({ ...sheet, materialName: e.target.value })} />
              </Field>
              <Field label="Tipo de impresión">
                <input className="input" value={sheet.printType} onChange={(e) => setSheet({ ...sheet, printType: e.target.value })} />
              </Field>
              <Field label="RIP">
                <input className="input" value={sheet.rip} onChange={(e) => setSheet({ ...sheet, rip: e.target.value })} />
              </Field>
              <Field label="Máquina">
                <input className="input" value={sheet.machine} onChange={(e) => setSheet({ ...sheet, machine: e.target.value })} />
              </Field>
              <Field label="Cantidad material (ft²)">
                <input type="number" min="0" step="0.01" className="input" value={sheet.materialQty} onChange={(e) => setSheet({ ...sheet, materialQty: Number(e.target.value) })} />
              </Field>
              <Field label="Costo material ($)">
                <input type="number" min="0" step="0.01" className="input" value={sheet.materialCost} onChange={(e) => setSheet({ ...sheet, materialCost: Number(e.target.value) })} />
              </Field>
              <Field label="Costo tinta ($)">
                <input type="number" min="0" step="0.01" className="input" value={sheet.inkCost} onChange={(e) => setSheet({ ...sheet, inkCost: Number(e.target.value) })} />
              </Field>
              <Field label="Otros costos ($)">
                <input type="number" min="0" step="0.01" className="input" value={sheet.otherCost} onChange={(e) => setSheet({ ...sheet, otherCost: Number(e.target.value) })} />
              </Field>
              <Field label="Notas / detalles para repetir" full>
                <textarea rows={2} className="textarea" value={sheet.notes} onChange={(e) => setSheet({ ...sheet, notes: e.target.value })} />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
              <button className="btn btn-primary" onClick={saveSheet} disabled={saving}>
                {saving ? "Guardando..." : "Guardar ficha"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-white/70">
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function ApprovalRequestModal({
  project, onClose, onDone,
}: {
  project: Project;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<"design" | "quote">("design");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filesText, setFilesText] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) { alert("Escribe un título"); return; }
    const files = filesText.split("\n").map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    const r = await fetch(`/api/work-projects/${project.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description: description || null, files }),
    });
    setSaving(false);
    if (!r.ok) { alert("Error al solicitar aprobación"); return; }
    alert("Solicitud enviada al cliente");
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="heading-md">#{project.number} · Pedir aprobación</h2>
          <button className="text-white/50 hover:text-white" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <Field label="Tipo">
            <select className="select" value={type} onChange={(e) => setType(e.target.value as "design" | "quote")}>
              <option value="design">Diseño / arte</option>
              <option value="quote">Cotización</option>
            </select>
          </Field>
          <Field label="Título">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Aprobar arte final del banner" />
          </Field>
          <Field label="Descripción / instrucciones">
            <textarea rows={3} className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Enlaces de archivos (uno por línea)">
            <textarea rows={2} className="textarea" value={filesText} onChange={(e) => setFilesText(e.target.value)}
              placeholder="https://..." />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Enviando..." : "Enviar al cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
