"use client";

import { useEffect, useState } from "react";
import type { Service } from "@prisma/client";
import { Plus, Trash2, Pencil, Star } from "lucide-react";

type Form = Omit<Service, "id" | "createdAt" | "updatedAt" | "gallery"> & {
  id?: string;
  gallery: string[];
};

function parseGallery(raw?: string | null): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

const empty: Form = {
  slug: "", titleEs: "", titleEn: "", descEs: "", descEn: "",
  icon: "", image: "", gallery: [], order: 0, active: true
};

export default function ServicesAdmin() {
  const [items, setItems] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUpload, setBusyUpload] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/servicios");
    setItems(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const payload = { ...editing, gallery: JSON.stringify(editing.gallery) };
    const url = editing.id ? `/api/servicios/${editing.id}` : "/api/servicios";
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) { alert("Error al guardar"); return; }
    setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar?")) return;
    await fetch(`/api/servicios/${id}`, { method: "DELETE" });
    load();
  }

  async function addGalleryImage(file: File) {
    setBusyUpload(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.url) { alert("Error al subir imagen"); return; }
      setEditing((prev) => {
        if (!prev) return prev;
        const newGallery = [...prev.gallery, data.url as string];
        return { ...prev, gallery: newGallery, image: prev.image || data.url };
      });
    } finally {
      setBusyUpload(false);
    }
  }

  function removeGalleryImage(idx: number) {
    setEditing((prev) => {
      if (!prev) return prev;
      const newGallery = prev.gallery.filter((_, i) => i !== idx);
      const newFeatured = prev.image === prev.gallery[idx] ? (newGallery[0] ?? "") : prev.image;
      return { ...prev, gallery: newGallery, image: newFeatured };
    });
  }

  function setFeatured(url: string) {
    setEditing((prev) => prev ? { ...prev, image: url } : prev);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">Servicios</h1>
        <button className="btn btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/55 bg-white/5">
            <tr>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Título (ES)</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-white/55">Cargando...</td></tr>}
            {items.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{s.order}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.slug}</td>
                <td className="px-4 py-3 font-medium">{s.titleEs}</td>
                <td className="px-4 py-3">{s.active ? "Sí" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-white/70 hover:text-white mr-3"
                    onClick={() => setEditing({ ...s, gallery: parseGallery(s.gallery) })}
                  >
                    <Pencil size={16} />
                  </button>
                  <button className="text-red-600 hover:text-red-800" onClick={() => remove(s.id)}>
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
          <div className="card w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading-md mb-5">{editing.id ? "Editar" : "Nuevo"} servicio</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Slug"><input className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Orden"><input type="number" className="input" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Field>
              <Field label="Título (ES)"><input className="input" value={editing.titleEs} onChange={(e) => setEditing({ ...editing, titleEs: e.target.value })} /></Field>
              <Field label="Título (EN)"><input className="input" value={editing.titleEn ?? ""} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} /></Field>
              <Field label="Descripción (ES)" full><textarea rows={3} className="textarea" value={editing.descEs} onChange={(e) => setEditing({ ...editing, descEs: e.target.value })} /></Field>
              <Field label="Descripción (EN)" full><textarea rows={3} className="textarea" value={editing.descEn ?? ""} onChange={(e) => setEditing({ ...editing, descEn: e.target.value })} /></Field>
              <Field label="Activo">
                <select className="select" value={editing.active ? "1" : "0"} onChange={(e) => setEditing({ ...editing, active: e.target.value === "1" })}>
                  <option value="1">Sí</option><option value="0">No</option>
                </select>
              </Field>

              {/* Gallery */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Galería de imágenes</label>
                  <label className={`btn btn-outline text-xs cursor-pointer ${busyUpload ? "opacity-50 pointer-events-none" : ""}`}>
                    {busyUpload ? "Subiendo..." : "+ Agregar imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busyUpload}
                      onChange={(e) => { if (e.target.files?.[0]) addGalleryImage(e.target.files[0]); e.target.value = ""; }}
                    />
                  </label>
                </div>
                {editing.gallery.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-3">Sin imágenes. Agrega una para comenzar.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {editing.gallery.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-white/5 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {editing.image === url && (
                          <div className="absolute top-2 left-2 bg-[var(--color-brand-500)] text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Destacada
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="Marcar como destacada"
                            onClick={() => setFeatured(url)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                              editing.image === url
                                ? "bg-[var(--color-brand-500)] text-black"
                                : "bg-white/20 text-white hover:bg-[var(--color-brand-500)] hover:text-black"
                            }`}
                          >
                            <Star size={14} fill={editing.image === url ? "currentColor" : "none"} />
                          </button>
                          <button
                            type="button"
                            title="Eliminar imagen"
                            onClick={() => removeGalleryImage(i)}
                            className="w-9 h-9 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
