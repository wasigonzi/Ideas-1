"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Pencil, ToggleLeft, ToggleRight,
  ShoppingBag, GripVertical, ChevronDown, ChevronUp, X, ImagePlus,
} from "lucide-react";

interface Variant {
  id?: string;
  title: string;
  option1: string;
  option2: string;
  price: string;
  compareAtPrice: string;
  available: boolean;
}

interface StoreProduct {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  images?: string | null;
  variants?: string | null;
  priceFrom: number;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

type Form = Omit<StoreProduct, "id" | "createdAt" | "updatedAt" | "images" | "variants"> & {
  id?: string;
  images: string[];
  variants: Variant[];
};

const emptyForm: Form = {
  slug: "", title: "", description: "", category: "",
  image: "", images: [], variants: [], priceFrom: 0, active: true, order: 0,
};

function parseImages(raw?: string | null): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}
function parseVariants(raw?: string | null): Variant[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TiendaAdmin() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/tienda?all=1");
    const data = await r.json();
    setProducts(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing({ ...emptyForm, images: [], variants: [] });
  }

  function openEdit(p: StoreProduct) {
    setEditing({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description ?? "",
      category: p.category ?? "",
      image: p.image ?? "",
      images: parseImages(p.images),
      variants: parseVariants(p.variants),
      priceFrom: p.priceFrom,
      active: p.active,
      order: p.order,
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: editing.slug || slugify(editing.title),
        images: JSON.stringify(editing.images),
        variants: JSON.stringify(editing.variants),
      };
      const url = editing.id ? `/api/tienda/${editing.id}` : "/api/tienda";
      const method = editing.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { alert("Error al guardar el producto"); return; }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/tienda/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(p: StoreProduct) {
    const payload = {
      slug: p.slug, title: p.title, description: p.description,
      category: p.category, image: p.image,
      images: p.images, variants: p.variants,
      priceFrom: p.priceFrom, active: !p.active, order: p.order,
    };
    await fetch(`/api/tienda/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
  }

  async function uploadImage(file: File, forGallery = false) {
    setBusyUpload(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.url) { alert("Error al subir imagen"); return; }
      if (forGallery) {
        setEditing((prev) => prev ? { ...prev, images: [...prev.images, data.url] } : prev);
      } else {
        setEditing((prev) => prev ? { ...prev, image: data.url } : prev);
      }
    } finally {
      setBusyUpload(false);
    }
  }

  function addVariant() {
    if (!editing) return;
    setEditing({
      ...editing,
      variants: [...editing.variants, { title: "", option1: "", option2: "", price: "", compareAtPrice: "", available: true }],
    });
  }

  function updateVariant(idx: number, field: keyof Variant, value: string | boolean) {
    if (!editing) return;
    const updated = editing.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v);
    // auto-update title from option1 + option2
    const v = updated[idx];
    if (field === "option1" || field === "option2") {
      updated[idx] = { ...v, title: [v.option1, v.option2].filter(Boolean).join(" / ") };
    }
    setEditing({ ...editing, variants: updated });
  }

  function removeVariant(idx: number) {
    if (!editing) return;
    setEditing({ ...editing, variants: editing.variants.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="size-6 text-brand-400" />
            Tienda de Productos
          </h1>
          <p className="text-white/50 text-sm mt-1">{products.length} productos</p>
        </div>
        <button onClick={openNew} className="btn btn-brand gap-2 text-sm py-2 px-4">
          <Plus className="size-4" />
          Nuevo producto
        </button>
      </div>

      {/* Products list */}
      {loading ? (
        <div className="text-white/40 py-12 text-center">Cargando…</div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-white/40 flex flex-col items-center gap-3">
          <ShoppingBag className="size-12" />
          <p>No hay productos. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const variants = parseVariants(p.variants);
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className={`card-elev rounded-xl border transition-all ${p.active ? "border-white/10" : "border-white/5 opacity-60"}`}>
                <div className="flex items-center gap-3 p-4">
                  <GripVertical className="size-4 text-white/20 shrink-0" />
                  {/* Thumbnail */}
                  <div className="size-12 rounded-lg overflow-hidden bg-ink-700 shrink-0">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-white/20">
                        <ShoppingBag className="size-5" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{p.title}</p>
                    <p className="text-xs text-white/40 truncate">
                      {p.category && <span className="mr-2 text-brand-400/70">{p.category}</span>}
                      {variants.length > 0 ? `${variants.length} variantes` : `$${p.priceFrom.toFixed(2)}`}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.active ? "Desactivar" : "Activar"}
                      className="text-white/40 hover:text-brand-400 transition-colors"
                    >
                      {p.active ? <ToggleRight className="size-5 text-green-400" /> : <ToggleLeft className="size-5" />}
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="text-white/40 hover:text-brand-400 transition-colors"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {/* Expanded: variants preview */}
                {isExpanded && variants.length > 0 && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3">
                    <p className="text-xs text-white/40 mb-2 uppercase tracking-widest font-semibold">Variantes</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v, i) => (
                        <span key={i} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/70">
                          {v.title || v.option1} — <span className="text-brand-400">${v.price}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="card-elev w-full max-w-2xl rounded-2xl p-6 space-y-5 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">
                {editing.id ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            {/* Basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white/70">Título</label>
                <input
                  className="input mt-1"
                  value={editing.title}
                  onChange={(e) => setEditing({
                    ...editing, title: e.target.value,
                    slug: editing.id ? editing.slug : slugify(e.target.value),
                  })}
                  placeholder="Ej. Stickers Full Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">Slug (URL)</label>
                <input
                  className="input mt-1"
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="stickers-full-color"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">Categoría</label>
                <input
                  className="input mt-1"
                  value={editing.category ?? ""}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  placeholder="Ej. Stickers, Banners, D-Boards"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">Precio desde ($)</label>
                <input
                  className="input mt-1"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editing.priceFrom}
                  onChange={(e) => setEditing({ ...editing, priceFrom: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">Orden</label>
                <input
                  className="input mt-1"
                  type="number"
                  value={editing.order}
                  onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-3 self-end pb-1">
                <label className="text-sm font-medium text-white/70">Activo</label>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, active: !editing.active })}
                  className={`transition-colors ${editing.active ? "text-green-400" : "text-white/30"}`}
                >
                  {editing.active ? <ToggleRight className="size-7" /> : <ToggleLeft className="size-7" />}
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-white/70">Descripción</label>
              <textarea
                className="textarea mt-1 h-28"
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Descripción del producto..."
              />
            </div>

            {/* Cover image */}
            <div>
              <label className="text-sm font-medium text-white/70">Imagen principal (URL o subir)</label>
              <div className="flex gap-2 mt-1">
                <input
                  className="input flex-1"
                  value={editing.image ?? ""}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busyUpload}
                  className="btn btn-outline py-2 px-3 text-sm shrink-0"
                >
                  <ImagePlus className="size-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              </div>
              {editing.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editing.image} alt="preview" className="mt-2 h-24 rounded-lg object-cover border border-white/10" />
              )}
            </div>

            {/* Gallery images */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/70">Galería de imágenes</label>
                <button type="button" onClick={() => galleryRef.current?.click()} disabled={busyUpload} className="text-xs text-brand-400 hover:underline flex items-center gap-1">
                  <Plus className="size-3" /> Agregar
                </button>
                <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, true); }} />
              </div>
              {editing.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editing.images.map((url, i) => (
                    <div key={i} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-16 w-16 rounded object-cover border border-white/10" />
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, images: editing.images.filter((_, idx) => idx !== i) })}
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* also allow pasting URL */}
              <input
                className="input mt-2 text-sm"
                placeholder="Pegar URL de imagen y presionar Enter para agregar"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.currentTarget.value ?? "").trim();
                    if (val) {
                      setEditing({ ...editing, images: [...editing.images, val] });
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/70">Variantes</label>
                <button type="button" onClick={addVariant} className="text-xs text-brand-400 hover:underline flex items-center gap-1">
                  <Plus className="size-3" /> Agregar variante
                </button>
              </div>
              {editing.variants.length === 0 && (
                <p className="text-xs text-white/30">Sin variantes. Se usará el precio base.</p>
              )}
              <div className="space-y-3">
                {editing.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <div>
                      {i === 0 && <label className="label-admin text-xs">Tamaño / Opción</label>}
                      <input
                        className="input mt-0.5 text-sm"
                        value={v.option1}
                        onChange={(e) => updateVariant(i, "option1", e.target.value)}
                        placeholder={'Ej. 2×2"'}
                      />
                    </div>
                    <div>
                      {i === 0 && <label className="label-admin text-xs">Opción 2</label>}
                      <input
                        className="input mt-0.5 text-sm"
                        value={v.option2}
                        onChange={(e) => updateVariant(i, "option2", e.target.value)}
                        placeholder="Ej. Diseño $75"
                      />
                    </div>
                    <div>
                      {i === 0 && <label className="label-admin text-xs">Precio</label>}
                      <input
                        className="input mt-0.5 text-sm"
                        value={v.price}
                        onChange={(e) => updateVariant(i, "price", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="text-white/30 hover:text-red-400 mb-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button onClick={() => setEditing(null)} className="btn btn-outline py-2 px-5 text-sm">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="btn btn-brand py-2 px-5 text-sm">
                {saving ? "Guardando…" : "Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
