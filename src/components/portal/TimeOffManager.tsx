"use client";

import { useEffect, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

type Reviewer = { id: string; name: string | null } | null;
type Request = {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
  status: string;
  reviewNote: string | null;
  reviewer: Reviewer;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  sick: "Enfermedad",
  personal: "Personal",
  unpaid: "Sin paga",
  other: "Otro",
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-500/20 text-amber-300" },
  approved: { label: "Aprobada", cls: "bg-emerald-500/20 text-emerald-300" },
  denied: { label: "Denegada", cls: "bg-rose-500/20 text-rose-300" },
  cancelled: { label: "Cancelada", cls: "bg-white/10 text-white/50" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-PR", { year: "numeric", month: "short", day: "numeric" });
}

export function TimeOffManager() {
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ startDate: "", endDate: "", type: "vacation", reason: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/dias-libres");
    setItems(r.ok ? await r.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.startDate || !form.endDate) { alert("Selecciona las fechas"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/dias-libres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { alert("Error al enviar la solicitud"); return; }
      setOpen(false);
      setForm({ startDate: "", endDate: "", type: "vacation", reason: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    await fetch(`/api/dias-libres/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg">Días libres</h1>
          <p className="text-white/65 mt-1">Solicita días y revisa el estado de tus solicitudes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Solicitar
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/55 bg-white/5">
            <tr>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Hasta</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Nota del PM</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-white/55">Cargando...</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-white/40 italic">No tienes solicitudes.</td></tr>
            )}
            {items.map((r) => {
              const st = STATUS[r.status] ?? STATUS.pending;
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{fmt(r.startDate)}</td>
                  <td className="px-4 py-3">{fmt(r.endDate)}</td>
                  <td className="px-4 py-3 text-white/70">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60 text-xs max-w-[200px] truncate">{r.reviewNote ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" && (
                      <button className="text-red-500/70 hover:text-red-500" onClick={() => cancel(r.id)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="heading-md">Solicitar días libres</h2>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid gap-4">
              <Field label="Desde">
                <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </Field>
              <Field label="Hasta">
                <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </Field>
              <Field label="Tipo">
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Motivo (opcional)">
                <textarea rows={3} className="textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}
