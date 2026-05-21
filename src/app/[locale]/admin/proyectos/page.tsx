"use client";

import { useEffect, useState } from "react";
import type { Project } from "@prisma/client";
import { ImageUploader } from "@/components/ImageUploader";
import { Plus, Trash2, Pencil } from "lucide-react";

type Form = Omit<Project, "id" | "createdAt" | "updatedAt"> & { id?: string };
const empty: Form = {
  slug: "", titleEs: "", titleEn: "", descEs: "", descEn: "",
  category: "", cover: "", images: "[]", featured: false
};

export default function ProjectsAdmin() {
  const [items, setItems] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/proyectos");
    setItems(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const url = editing.id ? `/api/proyectos/${editing.id}` : "/api/proyectos";
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    if (!r.ok) { alert("Error al guardar"); return; }
    setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar?")) return;
    await fetch(`/api/proyectos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">Proyectos</h1>
        <button className="btn btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {loading && <p className="text-white/55">Cargando...</p>}
        {items.map((p) => (
          <div key={p.id} className="card overflow-hidden">
            <div className="aspect-video bg-white/5 relative">
              {p.cover && <img src={p.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="text-xs text-white/55">{p.category}</div>
              <div className="font-semibold">{p.titleEs}</div>
              <div className="flex justify-end gap-2 mt-2">
                <button className="text-white/70 hover:text-white" onClick={() => setEditing(p)}><Pencil size={16} /></button>
                <button className="text-red-600 hover:text-red-800" onClick={() => remove(p.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading-md mb-5">{editing.id ? "Editar" : "Nuevo"} proyecto</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Slug"><input className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Categoría"><input className="input" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Título (ES)"><input className="input" value={editing.titleEs} onChange={(e) => setEditing({ ...editing, titleEs: e.target.value })} /></Field>
              <Field label="Título (EN)"><input className="input" value={editing.titleEn} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} /></Field>
              <Field label="Descripción (ES)" full><textarea rows={3} className="textarea" value={editing.descEs} onChange={(e) => setEditing({ ...editing, descEs: e.target.value })} /></Field>
              <Field label="Descripción (EN)" full><textarea rows={3} className="textarea" value={editing.descEn} onChange={(e) => setEditing({ ...editing, descEn: e.target.value })} /></Field>
              <Field label="Destacado">
                <select className="select" value={editing.featured ? "1" : "0"} onChange={(e) => setEditing({ ...editing, featured: e.target.value === "1" })}>
                  <option value="0">No</option><option value="1">Sí</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <ImageUploader label="Portada" value={editing.cover} onChange={(url) => setEditing({ ...editing, cover: url })} />
              </div>
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
