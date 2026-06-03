"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

type User = { id: string; name: string | null; email: string; avatar: string | null };
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
  user: User;
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

const FILTERS = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "denied", label: "Denegadas" },
  { key: "", label: "Todas" },
];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-PR", { year: "numeric", month: "short", day: "numeric" });
}

export default function DiasLibresAdmin() {
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/dias-libres/admin${filter ? `?status=${filter}` : ""}`);
    setItems(r.ok ? await r.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  async function review(id: string, action: "approve" | "deny") {
    let reviewNote: string | null = null;
    if (action === "deny") {
      reviewNote = prompt("Motivo de la denegación (opcional):") ?? "";
    }
    const r = await fetch(`/api/dias-libres/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNote }),
    });
    if (!r.ok) { alert("No se pudo procesar"); return; }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-lg">Días libres</h1>
        <p className="text-sm text-white/55 mt-1">Aprueba o deniega las solicitudes del equipo.</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-sm px-3 py-1.5 rounded-full ${filter === f.key ? "bg-[var(--color-brand-500)] text-black font-semibold" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/55 bg-white/5">
            <tr>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Hasta</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-white/55">Cargando...</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-white/40 italic">Sin solicitudes.</td></tr>
            )}
            {items.map((r) => {
              const st = STATUS[r.status] ?? STATUS.pending;
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{r.user.name ?? r.user.email}</td>
                  <td className="px-4 py-3">{fmt(r.startDate)}</td>
                  <td className="px-4 py-3">{fmt(r.endDate)}</td>
                  <td className="px-4 py-3 text-white/70">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-white/60 text-xs max-w-[200px] truncate">{r.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 grid place-items-center"
                          title="Aprobar"
                          onClick={() => review(r.id, "approve")}
                        >
                          <Check size={15} />
                        </button>
                        <button
                          className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 grid place-items-center"
                          title="Denegar"
                          onClick={() => review(r.id, "deny")}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-white/40">{r.reviewer?.name ?? "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
