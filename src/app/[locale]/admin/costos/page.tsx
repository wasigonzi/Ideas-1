"use client";

import { useEffect, useState } from "react";
import type { RoleRate, ShopCapacity } from "@prisma/client";
import { Plus, Trash2, Pencil } from "lucide-react";

type RoleForm = Omit<RoleRate, "id" | "createdAt" | "updatedAt"> & { id?: string };
type CapForm = Omit<ShopCapacity, "id" | "createdAt" | "updatedAt"> & { id?: string };

const emptyRole: RoleForm = { id: undefined, role: "", hourlyCost: 0, notes: "", active: true };
const emptyCap: CapForm = { id: undefined, process: "", unitsPerDay: 0, unitLabel: "planchas", notes: "", active: true };

export default function CostosAdmin() {
  const [roles, setRoles] = useState<RoleRate[]>([]);
  const [caps, setCaps] = useState<ShopCapacity[]>([]);
  const [editingRole, setEditingRole] = useState<RoleForm | null>(null);
  const [editingCap, setEditingCap] = useState<CapForm | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [r1, r2] = await Promise.all([fetch("/api/costos-rol"), fetch("/api/capacidad")]);
    setRoles(r1.ok ? await r1.json() : []);
    setCaps(r2.ok ? await r2.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveRole() {
    if (!editingRole) return;
    const url = editingRole.id ? `/api/costos-rol/${editingRole.id}` : "/api/costos-rol";
    const r = await fetch(url, {
      method: editingRole.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingRole),
    });
    if (!r.ok) { alert("Error al guardar"); return; }
    setEditingRole(null); load();
  }

  async function removeRole(id: string) {
    if (!confirm("¿Eliminar rol?")) return;
    await fetch(`/api/costos-rol/${id}`, { method: "DELETE" });
    load();
  }

  async function saveCap() {
    if (!editingCap) return;
    const url = editingCap.id ? `/api/capacidad/${editingCap.id}` : "/api/capacidad";
    const r = await fetch(url, {
      method: editingCap.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingCap),
    });
    if (!r.ok) { alert("Error al guardar"); return; }
    setEditingCap(null); load();
  }

  async function removeCap(id: string) {
    if (!confirm("¿Eliminar proceso?")) return;
    await fetch(`/api/capacidad/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-10">
      {/* ── Costos por rol ── */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-lg">Costo por rol</h1>
            <p className="text-sm text-white/55 mt-1">Costo de hora-hombre por cada rol del taller.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setEditingRole({ ...emptyRole })}>
            <Plus size={16} /> Nuevo rol
          </button>
        </div>

        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 bg-white/5">
              <tr>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Costo / hora</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-white/55">Cargando...</td></tr>}
              {!loading && roles.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40 italic">Sin roles. Agrega el primero.</td></tr>
              )}
              {roles.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{r.role}</td>
                  <td className="px-4 py-3 font-mono">${r.hourlyCost.toFixed(2)}</td>
                  <td className="px-4 py-3">{r.active ? "Sí" : "No"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="text-white/70 hover:text-white mr-3" onClick={() => setEditingRole({ ...r })}><Pencil size={16} /></button>
                    <button className="text-red-600 hover:text-red-800" onClick={() => removeRole(r.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Capacidad del taller ── */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-lg">Capacidad del taller</h1>
            <p className="text-sm text-white/55 mt-1">Límite real de producción por proceso (ej. 300 planchas/día).</p>
          </div>
          <button className="btn btn-primary" onClick={() => setEditingCap({ ...emptyCap })}>
            <Plus size={16} /> Nuevo proceso
          </button>
        </div>

        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 bg-white/5">
              <tr>
                <th className="px-4 py-3">Proceso</th>
                <th className="px-4 py-3">Por día</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-white/55">Cargando...</td></tr>}
              {!loading && caps.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white/40 italic">Sin procesos. Agrega el primero.</td></tr>
              )}
              {caps.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{c.process}</td>
                  <td className="px-4 py-3 font-mono">{c.unitsPerDay}</td>
                  <td className="px-4 py-3 text-white/70">{c.unitLabel}</td>
                  <td className="px-4 py-3">{c.active ? "Sí" : "No"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="text-white/70 hover:text-white mr-3" onClick={() => setEditingCap({ ...c })}><Pencil size={16} /></button>
                    <button className="text-red-600 hover:text-red-800" onClick={() => removeCap(c.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Modal rol ── */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setEditingRole(null)}>
          <div className="card w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading-md mb-5">{editingRole.id ? "Editar" : "Nuevo"} rol</h2>
            <div className="grid gap-4">
              <Field label="Rol"><input className="input" placeholder="ej. Artista Gráfico" value={editingRole.role} onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })} /></Field>
              <Field label="Costo por hora ($)"><input type="number" step="0.01" min="0" className="input" value={editingRole.hourlyCost} onChange={(e) => setEditingRole({ ...editingRole, hourlyCost: Number(e.target.value) })} /></Field>
              <Field label="Activo">
                <select className="select" value={editingRole.active ? "1" : "0"} onChange={(e) => setEditingRole({ ...editingRole, active: e.target.value === "1" })}>
                  <option value="1">Sí</option><option value="0">No</option>
                </select>
              </Field>
              <Field label="Notas"><textarea rows={2} className="textarea" value={editingRole.notes ?? ""} onChange={(e) => setEditingRole({ ...editingRole, notes: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setEditingRole(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveRole}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal capacidad ── */}
      {editingCap && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setEditingCap(null)}>
          <div className="card w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading-md mb-5">{editingCap.id ? "Editar" : "Nuevo"} proceso</h2>
            <div className="grid gap-4">
              <Field label="Proceso"><input className="input" placeholder="ej. Impresión D-Board 3mm" value={editingCap.process} onChange={(e) => setEditingCap({ ...editingCap, process: e.target.value })} /></Field>
              <Field label="Unidades por día"><input type="number" min="0" className="input" value={editingCap.unitsPerDay} onChange={(e) => setEditingCap({ ...editingCap, unitsPerDay: Number(e.target.value) })} /></Field>
              <Field label="Etiqueta de unidad"><input className="input" placeholder="planchas, pies²" value={editingCap.unitLabel} onChange={(e) => setEditingCap({ ...editingCap, unitLabel: e.target.value })} /></Field>
              <Field label="Activo">
                <select className="select" value={editingCap.active ? "1" : "0"} onChange={(e) => setEditingCap({ ...editingCap, active: e.target.value === "1" })}>
                  <option value="1">Sí</option><option value="0">No</option>
                </select>
              </Field>
              <Field label="Notas"><textarea rows={2} className="textarea" value={editingCap.notes ?? ""} onChange={(e) => setEditingCap({ ...editingCap, notes: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setEditingCap(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveCap}>Guardar</button>
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
