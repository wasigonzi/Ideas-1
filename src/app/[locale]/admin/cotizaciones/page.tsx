"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Pencil, Trash2, X } from "lucide-react";
import { StatusPill } from "@/components/portal/ui";

type Quote = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  budget: string | null;
  deadline: string | null;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  quoted: "Cotización",
  won: "Aprobada",
  lost: "Rechazada",
};

const STATUSES = ["new", "reviewed", "quoted", "won", "lost"] as const;

const SERVICES = [
  "Rotulación vehicular",
  "Rótulos de negocio",
  "Impresión de gran formato",
  "Banners y lonas",
  "Letreros LED / canal",
  "Wayfinding / señalización",
  "Wrap completo",
  "Impresión digital",
  "Manufactura",
  "Mantenimiento",
  "Otro",
];

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "",
  service: "", budget: "", deadline: "", message: "", status: "quoted",
};

export default function QuotesAdmin() {
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/cotizaciones");
    setItems(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(q: Quote) {
    setEditing(q);
    setForm({
      name: q.name,
      email: q.email,
      phone: q.phone ?? "",
      company: q.company ?? "",
      service: q.service ?? "",
      budget: q.budget ?? "",
      deadline: q.deadline ?? "",
      message: q.message,
      status: q.status,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Nombre, email y descripción son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`/api/cotizaciones/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            company: form.company.trim() || null,
            service: form.service.trim() || null,
            budget: form.budget.trim() || null,
            deadline: form.deadline.trim() || null,
            message: form.message.trim(),
            status: form.status,
          }),
        });
      } else {
        res = await fetch("/api/cotizaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            company: form.company.trim() || null,
            service: form.service.trim() || null,
            budget: form.budget.trim() || null,
            deadline: form.deadline.trim() || null,
            message: form.message.trim() || "Cotización creada por administrador.",
          }),
        });
      }
      if (!res.ok) throw new Error("Error al guardar");
      setModalOpen(false);
      load();
    } catch {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta cotización?")) return;
    await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
    load();
  }

  const stats = {
    total: items.length,
    won: items.filter((q) => q.status === "won").length,
    pending: items.filter((q) => ["new", "reviewed", "quoted"].includes(q.status)).length,
    lost: items.filter((q) => q.status === "lost").length,
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="heading-lg">Cotizaciones</h1>
          <p className="text-white/65 mt-1">Gestiona las solicitudes y cotizaciones formales.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva cotización
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-xs uppercase text-white/55">Total</div><div className="text-2xl font-extrabold mt-1">{stats.total}</div></div>
        <div className="card p-4"><div className="text-xs uppercase text-white/55">Pendientes</div><div className="text-2xl font-extrabold text-amber-400 mt-1">{stats.pending}</div></div>
        <div className="card p-4"><div className="text-xs uppercase text-white/55">Aprobadas</div><div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.won}</div></div>
        <div className="card p-4"><div className="text-xs uppercase text-white/55">Rechazadas</div><div className="text-2xl font-extrabold text-red-400 mt-1">{stats.lost}</div></div>
      </div>

      {/* Table */}
      <section className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 text-xs uppercase tracking-wider bg-white/5">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Servicio</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-white/55">Cargando...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-white/55">Sin cotizaciones.</td></tr>
              )}
              {items.map((q) => (
                <tr key={q.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-white/60 text-xs">{new Date(q.createdAt).toLocaleDateString("es-PR")}</td>
                  <td className="px-5 py-3">
                    <div className="font-semibold">{q.name}</div>
                    <div className="text-xs text-white/50">{q.company ?? q.email}</div>
                  </td>
                  <td className="px-5 py-3 text-white/70">{q.service ?? "—"}</td>
                  <td className="px-5 py-3 font-semibold text-[var(--color-brand-400)]">
                    {q.budget
                      ? (isNaN(parseFloat(q.budget.replace(/[^0-9.]/g, "")))
                          ? q.budget
                          : `$${parseFloat(q.budget.replace(/[^0-9.]/g, "")).toLocaleString("en-US", { minimumFractionDigits: 2 })}`)
                      : "—"}
                  </td>
                  <td className="px-5 py-3"><StatusPill status={q.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/cotizaciones/${q.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver PDF"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-semibold transition-colors"
                      >
                        <FileText size={13} /> PDF
                      </a>
                      <button
                        onClick={() => openEdit(q)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(q.id)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center p-4 z-50" onClick={() => setModalOpen(false)}>
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editing ? "Editar cotización" : "Nueva cotización"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/55 mb-1">Nombre *</label>
                  <input className="input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1">Empresa</label>
                  <input className="input w-full" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Nombre de la empresa" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/55 mb-1">Email *</label>
                  <input className="input w-full" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1">Teléfono</label>
                  <input className="input w-full" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="787-000-0000" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/55 mb-1">Servicio</label>
                  <select className="select w-full" value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1">Estado</label>
                  <select className="select w-full" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/55 mb-1">Monto cotizado ($)</label>
                  <input className="input w-full" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1">Fecha de entrega</label>
                  <input className="input w-full" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/55 mb-1">Descripción / Alcance del trabajo *</label>
                <textarea className="textarea w-full" rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Describe el trabajo a realizar, materiales, dimensiones, cantidades..." />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="btn btn-outline">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear cotización"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
