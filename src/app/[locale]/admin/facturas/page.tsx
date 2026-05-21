"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FileText, X, Loader2, Check } from "lucide-react";
import { StatusPill } from "@/components/portal/ui";

type Invoice = {
  id: string; number: string;
  clientId: string | null;
  clientName: string | null; clientEmail: string | null;
  clientCompany: string | null; clientPhone: string | null;
  client: { id: string; name: string | null; email: string; phone: string | null; company: string | null } | null;
  amount: number; paid: number; status: string;
  issuedAt: string; dueDate: string; paidAt: string | null; notes: string | null;
};
type FormState = {
  clientName: string; clientEmail: string; clientCompany: string; clientPhone: string;
  amount: string; paid: string; dueDate: string; status: string; notes: string;
};

const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "overdue", label: "Vencida" },
  { value: "cancelled", label: "Cancelada" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "overdue", label: "Vencidas" },
  { value: "cancelled", label: "Canceladas" },
];

function emptyForm(): FormState {
  return { clientName: "", clientEmail: "", clientCompany: "", clientPhone: "", amount: "", paid: "0", dueDate: "", status: "pending", notes: "" };
}

function invoiceToForm(inv: Invoice): FormState {
  return {
    clientName:    inv.clientName    ?? inv.client?.company ?? inv.client?.name ?? "",
    clientEmail:   inv.clientEmail   ?? inv.client?.email   ?? "",
    clientCompany: inv.clientCompany ?? inv.client?.company ?? "",
    clientPhone:   inv.clientPhone   ?? inv.client?.phone   ?? "",
    amount:  String(inv.amount),
    paid:    String(inv.paid),
    dueDate: inv.dueDate.slice(0, 10),
    status:  inv.status,
    notes:   inv.notes ?? "",
  };
}

function currency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminFacturas() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    fetch("/api/facturas")
      .then((r) => r.json())
      .then((invs) => {
        setInvoices(Array.isArray(invs) ? invs : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  function openCreate() {
    setForm(emptyForm());
    setEditTarget(null);
    setModal("create");
  }

  function openEdit(inv: Invoice) {
    setForm(invoiceToForm(inv));
    setEditTarget(inv);
    setModal("edit");
  }

  async function save() {
    setSaving(true);
    try {
      const url = modal === "create" ? "/api/facturas" : `/api/facturas/${editTarget!.id}`;
      const method = modal === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          paid: Number(form.paid),
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const saved: Invoice = await res.json();
      setInvoices((prev) =>
        modal === "create" ? [saved, ...prev] : prev.map((i) => (i.id === saved.id ? saved : i))
      );
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/facturas/${deleteTarget.id}`, { method: "DELETE" });
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter);
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.amount - i.paid), 0);
  const canCreate = modal === "create" && !!form.clientName && !!form.amount && !!form.dueDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="heading-lg">Facturas</h1>
          <p className="text-white/65 mt-1">Gestión de cobros y cuentas por cobrar.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary shrink-0 flex items-center gap-2">
          <Plus size={16} /> Nueva factura
        </button>
      </header>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55">Facturado</div>
          <div className="text-2xl font-extrabold mt-1">{currency(billed)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55">Cobrado</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{currency(collected)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-white/55">Vencido</div>
          <div className="text-2xl font-extrabold text-red-400 mt-1">{currency(overdue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === s.value
                ? "bg-[var(--color-brand-500)] text-white"
                : "bg-white/8 text-white/65 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/55">
          <Loader2 className="animate-spin mr-2" size={18} /> Cargando…
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-white/55 text-xs uppercase tracking-wider bg-white/5">
                <tr>
                  <th className="px-6 py-3">Factura</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Vence</th>
                  <th className="px-6 py-3 text-right">Monto</th>
                  <th className="px-6 py-3 text-right">Pagado</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3 font-bold">{inv.number}</td>
                    <td className="px-6 py-3">
                      <div className="font-medium">{inv.clientCompany || inv.clientName || inv.client?.company || inv.client?.name || "—"}</div>
                      <div className="text-xs text-white/45">{inv.clientEmail || inv.client?.email}</div>
                    </td>
                    <td className="px-6 py-3 text-white/70">
                      {new Date(inv.dueDate).toLocaleDateString("es-PR")}
                    </td>
                    <td className="px-6 py-3 text-right font-medium">{currency(inv.amount)}</td>
                    <td className="px-6 py-3 text-right text-emerald-400">{currency(inv.paid)}</td>
                    <td className="px-6 py-3"><StatusPill status={inv.status} /></td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => window.open(`/api/facturas/${inv.id}/pdf`, "_blank")}
                          title="Exportar PDF"
                          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(inv)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-white/10 text-white/55 hover:text-white transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(inv)}
                          title="Eliminar"
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-white/55">
                      {statusFilter === "all" ? "Sin facturas aún." : "Sin facturas con este estado."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-[var(--color-ink-900)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">
                {modal === "create" ? "Nueva factura" : `Editar ${editTarget?.number}`}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded hover:bg-white/10 text-white/55">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Nombre *</label>
                  <input
                    className="input w-full" placeholder="Juan Pérez"
                    value={form.clientName}
                    onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Empresa</label>
                  <input
                    className="input w-full" placeholder="Nombre de la empresa"
                    value={form.clientCompany}
                    onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Email</label>
                  <input
                    type="email" className="input w-full" placeholder="email@ejemplo.com"
                    value={form.clientEmail}
                    onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Teléfono</label>
                  <input
                    className="input w-full" placeholder="(787) 000-0000"
                    value={form.clientPhone}
                    onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Amount + Paid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Monto *</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="input w-full" placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Pagado</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="input w-full" placeholder="0.00"
                    value={form.paid}
                    onChange={(e) => setForm((f) => ({ ...f, paid: e.target.value }))}
                  />
                </div>
              </div>

              {/* Due date + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Vence *</label>
                  <input
                    type="date" className="input w-full"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">Estado</label>
                  <select
                    className="select w-full"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Descripción / notas</label>
                <textarea
                  className="textarea w-full" rows={3}
                  placeholder="Servicios prestados, observaciones…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setModal(null)} className="btn btn-outline">Cancelar</button>
              <button
                onClick={save}
                disabled={saving || (modal === "create" && !canCreate)}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {modal === "create" ? "Crear factura" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-[var(--color-ink-900)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Eliminar factura</h2>
            <p className="text-white/70 text-sm">
              ¿Eliminar <span className="font-bold text-white">{deleteTarget.number}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn btn-outline">Cancelar</button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="btn flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
