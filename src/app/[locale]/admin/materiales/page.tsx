"use client";

import { useEffect, useState } from "react";
import type { Material } from "@prisma/client";
import { Plus, Trash2, Pencil } from "lucide-react";

type Form = Omit<Material, "id" | "createdAt" | "updatedAt"> & { id?: string };

const CATEGORIES = [
  "d-board",
  "pvc",
  "acrilico",
  "banner",
  "microperforado",
  "vinil",
  "mesh",
  "static-cling",
  "otro",
];

const empty: Form = {
  id: undefined,
  name: "",
  category: "d-board",
  thickness: "",
  costPerSqFt: 0,
  unit: "ft2",
  notes: "",
  active: true,
};

export default function MaterialesAdmin() {
  const [items, setItems] = useState<Material[]>([]);
  const [editing, setEditing] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/materiales");
    setItems(r.ok ? await r.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const url = editing.id ? `/api/materiales/${editing.id}` : "/api/materiales";
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!r.ok) { alert("Error al guardar"); return; }
    setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar material?")) return;
    await fetch(`/api/materiales/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg">Materiales</h1>
          <p className="text-sm text-white/55 mt-1">
            Catálogo con costo por pie². Base del motor de precios y costos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/55 bg-white/5">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Espesor</th>
              <th className="px-4 py-3">Costo / pie²</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-white/55">Cargando...</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-white/40 italic">Sin materiales. Agrega el primero.</td></tr>
            )}
            {items.map((m) => (
              <tr key={m.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-white/70">{m.category}</td>
                <td className="px-4 py-3 text-white/70">{m.thickness || "—"}</td>
                <td className="px-4 py-3 font-mono">${m.costPerSqFt.toFixed(2)}</td>
                <td className="px-4 py-3">{m.active ? "Sí" : "No"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button className="text-white/70 hover:text-white mr-3" onClick={() => setEditing({ ...m })}>
                    <Pencil size={16} />
                  </button>
                  <button className="text-red-600 hover:text-red-800" onClick={() => remove(m.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading-md mb-5">{editing.id ? "Editar" : "Nuevo"} material</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nombre"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Categoría">
                <select className="select" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Espesor"><input className="input" placeholder='ej. 3mm, 1/8"' value={editing.thickness ?? ""} onChange={(e) => setEditing({ ...editing, thickness: e.target.value })} /></Field>
              <Field label="Costo por pie² ($)"><input type="number" step="0.01" min="0" className="input" value={editing.costPerSqFt} onChange={(e) => setEditing({ ...editing, costPerSqFt: Number(e.target.value) })} /></Field>
              <Field label="Unidad"><input className="input" value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></Field>
              <Field label="Activo">
                <select className="select" value={editing.active ? "1" : "0"} onChange={(e) => setEditing({ ...editing, active: e.target.value === "1" })}>
                  <option value="1">Sí</option><option value="0">No</option>
                </select>
              </Field>
              <Field label="Notas" full><textarea rows={2} className="textarea" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
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
