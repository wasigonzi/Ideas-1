"use client";

import { useEffect, useState } from "react";
import {
  Plus, Trash2, Pencil, Search, History, Package,
  ArrowUpRight, ArrowDownLeft, Scale, AlertTriangle, X
} from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  unitCost: number;
  supplier: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryMovement {
  id: string;
  itemId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  prevStock: number;
  newStock: number;
  note: string | null;
  userEmail: string | null;
  createdAt: string;
  item: {
    name: string;
    unit: string;
    sku: string | null;
    category: string;
  };
}

type ItemForm = Omit<InventoryItem, "id" | "stock" | "createdAt" | "updatedAt"> & {
  id?: string;
  initialStock?: number; // only when creating new
};

const CATEGORIES = [
  "Vinilos",
  "Tintas",
  "Laminados",
  "Rígidos",
  "Accesorios",
  "Herramientas",
  "Otros"
];

const emptyForm: ItemForm = {
  sku: "",
  name: "",
  description: "",
  category: "Vinilos",
  minStock: 0,
  unit: "unidades",
  unitCost: 0,
  supplier: "",
  active: true,
  initialStock: 0
};

interface QuickAdjustForm {
  itemId: string;
  itemName: string;
  itemUnit: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  note: string;
}

export default function InventarioAdmin() {
  const [activeTab, setActiveTab] = useState<"articulos" | "historial">("articulos");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [editingItem, setEditingItem] = useState<ItemForm | null>(null);
  const [adjustingStock, setAdjustingStock] = useState<QuickAdjustForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const r = await fetch("/api/inventario");
      setItems(r.ok ? await r.json() : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements() {
    setLoading(true);
    try {
      const r = await fetch("/api/inventario/movimientos");
      setMovements(r.ok ? await r.json() : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "articulos") {
      loadItems();
    } else {
      loadMovements();
    }
  }, [activeTab]);

  async function saveItem() {
    if (!editingItem) return;
    setSaving(true);
    try {
      // If initial stock is not set when creating, default to 0
      const payload = {
        ...editingItem,
        stock: editingItem.id ? undefined : (editingItem.initialStock ?? 0)
      };

      const url = editingItem.id ? `/api/inventario/${editingItem.id}` : "/api/inventario";
      const method = editingItem.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const errData = await r.json();
        alert(errData.error || "Error al guardar el artículo");
        return;
      }

      setEditingItem(null);
      loadItems();
    } catch (e) {
      console.error(e);
      alert("Error al intentar guardar");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("¿Eliminar este artículo del inventario? Esto borrará también sus registros de movimiento asociados.")) return;
    try {
      const r = await fetch(`/api/inventario/${id}`, { method: "DELETE" });
      if (r.ok) {
        loadItems();
      } else {
        alert("Error al eliminar el artículo");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function saveStockAdjustment() {
    if (!adjustingStock) return;
    if (!adjustingStock.note.trim()) {
      alert("Debes escribir una nota o motivo para el ajuste de inventario");
      return;
    }
    if (adjustingStock.quantity <= 0) {
      alert("La cantidad debe ser mayor que cero");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(`/api/inventario/${adjustingStock.itemId}/movimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustingStock.type,
          quantity: adjustingStock.quantity,
          note: adjustingStock.note,
        }),
      });

      if (!r.ok) {
        const errData = await r.json();
        alert(errData.error || "Error al registrar el movimiento");
        return;
      }

      setAdjustingStock(null);
      loadItems();
    } catch (e) {
      console.error(e);
      alert("Error al intentar ajustar el stock");
    } finally {
      setSaving(false);
    }
  }

  // Filtered items list
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(search.toLowerCase())) ||
      (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === "Todos" || item.category === categoryFilter;
    const matchesLowStock = !onlyLowStock || item.stock <= item.minStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-6 p-1 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <Package className="size-7 text-brand-400" />
            Control de Inventario
          </h1>
          <p className="text-sm text-white/55 mt-1">
            Gestión física de insumos, stock de producción, alertas de mínimos e historial de movimientos.
          </p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === "articulos" && (
            <button className="btn btn-primary flex items-center gap-1.5" onClick={() => setEditingItem({ ...emptyForm })}>
              <Plus size={16} /> Nuevo Artículo
            </button>
          )}
          <button 
            onClick={() => loadItems()} 
            className="btn btn-outline text-xs py-2 px-3 self-center"
            title="Recargar datos"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab("articulos")}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === "articulos" 
              ? "text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-400" 
              : "text-white/60 hover:text-white"
          }`}
        >
          Artículos en Inventario
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === "historial" 
              ? "text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-400" 
              : "text-white/60 hover:text-white"
          }`}
        >
          Historial de Movimientos
        </button>
      </div>

      {/* ARTICLES TAB */}
      {activeTab === "articulos" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-white/35">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="input pl-9 w-full"
                placeholder="Buscar por nombre, SKU, proveedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="select w-full"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="Todos">Todas las categorías</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Low Stock Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="lowStockToggle"
                className="size-4 rounded accent-brand-500 bg-ink-950 border-white/20"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
              />
              <label htmlFor="lowStockToggle" className="text-sm text-white/80 cursor-pointer flex items-center gap-1.5 select-none">
                <AlertTriangle size={15} className={onlyLowStock ? "text-amber-400" : "text-white/40"} />
                Solo stock bajo / crítico
              </label>
            </div>

            {/* Stats summary */}
            <div className="text-right text-xs text-white/50">
              Mostrando {filteredItems.length} de {items.length} artículos
            </div>
          </div>

          {/* List Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-white/55 bg-white/5">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Artículo</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Stock Actual</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3 text-right">Costo Unit.</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-white/55">
                      Cargando inventario...
                    </td>
                  </tr>
                )}
                {!loading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-white/40 italic">
                      No se encontraron artículos en el inventario.
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} className="border-t border-white/10 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white/60">{item.sku || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-white/40 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-white/10 text-white/80">
                          {item.category}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold font-mono ${
                        isLow ? "text-amber-400 bg-amber-400/5" : "text-white"
                      }`}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isLow && <AlertTriangle size={13} className="text-amber-400" />}
                          {item.stock}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{item.unit}</td>
                      <td className="px-4 py-3 text-right font-mono text-white/70">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs truncate max-w-[120px]">{item.supplier || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${item.active ? "bg-green-500" : "bg-white/20"}`} title={item.active ? "Activo" : "Inactivo"} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {/* Quick Adjust buttons */}
                        <div className="inline-flex gap-1.5 mr-4">
                          <button
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 p-1.5 rounded transition-all"
                            title="Entrada de Stock"
                            onClick={() => setAdjustingStock({
                              itemId: item.id,
                              itemName: item.name,
                              itemUnit: item.unit,
                              type: "in",
                              quantity: 0,
                              note: ""
                            })}
                          >
                            <ArrowUpRight size={14} />
                          </button>
                          <button
                            className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 p-1.5 rounded transition-all"
                            title="Salida de Stock"
                            onClick={() => setAdjustingStock({
                              itemId: item.id,
                              itemName: item.name,
                              itemUnit: item.unit,
                              type: "out",
                              quantity: 0,
                              note: ""
                            })}
                          >
                            <ArrowDownLeft size={14} />
                          </button>
                          <button
                            className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 p-1.5 rounded transition-all"
                            title="Ajuste manual de Stock"
                            onClick={() => setAdjustingStock({
                              itemId: item.id,
                              itemName: item.name,
                              itemUnit: item.unit,
                              type: "adjustment",
                              quantity: item.stock,
                              note: ""
                            })}
                          >
                            <Scale size={14} />
                          </button>
                        </div>
                        
                        {/* Edit / delete */}
                        <button 
                          className="text-white/70 hover:text-white mr-3 p-1 hover:bg-white/5 rounded" 
                          onClick={() => setEditingItem({
                            id: item.id,
                            sku: item.sku ?? "",
                            name: item.name,
                            description: item.description ?? "",
                            category: item.category,
                            minStock: item.minStock,
                            unit: item.unit,
                            unitCost: item.unitCost,
                            supplier: item.supplier ?? "",
                            active: item.active
                          })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-500/5 rounded" 
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HISTORIAL TAB */}
      {activeTab === "historial" && (
        <div className="space-y-4">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-white/55 bg-white/5">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Artículo / Insumo</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Flujo (Prev → Nuevo)</th>
                  <th className="px-4 py-3">Motivo / Nota</th>
                  <th className="px-4 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-white/55">
                      Cargando historial de movimientos...
                    </td>
                  </tr>
                )}
                {!loading && movements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-white/40 italic">
                      No se han registrado movimientos de inventario todavía.
                    </td>
                  </tr>
                )}
                {movements.map((m) => {
                  const date = new Date(m.createdAt).toLocaleString("es-PR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={m.id} className="border-t border-white/10 hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3 text-white/60 text-xs font-mono">{date}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{m.item?.name || "Artículo eliminado"}</div>
                        {m.item?.sku && (
                          <div className="text-xs text-white/40 font-mono mt-0.5">SKU: {m.item.sku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{m.item?.category || "—"}</td>
                      <td className="px-4 py-3">
                        {m.type === "in" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Entrada
                          </span>
                        )}
                        {m.type === "out" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Salida
                          </span>
                        )}
                        {m.type === "adjustment" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Ajuste
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold font-mono ${
                        m.quantity > 0 ? "text-emerald-400" : m.quantity < 0 ? "text-rose-400" : "text-white"
                      }`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-white/50">
                        {m.prevStock} → <span className="text-white">{m.newStock}</span> {m.item?.unit || "u"}
                      </td>
                      <td className="px-4 py-3 text-white/70 italic text-xs max-w-[200px] truncate" title={m.note ?? ""}>
                        {m.note || "—"}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs font-mono">{m.userEmail || "Sistema"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ARTICLE NEW/EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center p-4 z-50 animate-fade-in" onClick={() => setEditingItem(null)}>
          <div className="card w-full max-w-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative space-y-6" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="heading-md flex items-center gap-2">
                <Package size={20} className="text-brand-400" />
                {editingItem.id ? "Editar Artículo" : "Nuevo Artículo de Inventario"}
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nombre del Artículo / Insumo">
                <input
                  className="input"
                  placeholder='ej. Vinilo Autoadhesivo Glossy 54"'
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </Field>

              <Field label="Código SKU / Barra (opcional)">
                <input
                  className="input"
                  placeholder="ej. VIN-GLO-54"
                  value={editingItem.sku ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                />
              </Field>

              <Field label="Categoría">
                <select
                  className="select"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Proveedor sugerido">
                <input
                  className="input"
                  placeholder="ej. Grimco, Inc."
                  value={editingItem.supplier ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                />
              </Field>

              <Field label="Unidad de medida">
                <input
                  className="input"
                  placeholder="ej. rollos, yardas, unidades, lts"
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                />
              </Field>

              <Field label="Costo Unitario ($)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input font-mono"
                  value={editingItem.unitCost}
                  onChange={(e) => setEditingItem({ ...editingItem, unitCost: Number(e.target.value) })}
                />
              </Field>

              <Field label="Stock Mínimo (Alerta de bajo stock)">
                <input
                  type="number"
                  min="0"
                  className="input font-mono"
                  value={editingItem.minStock}
                  onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                />
              </Field>

              {!editingItem.id && (
                <Field label="Stock Inicial (Cantidad)">
                  <input
                    type="number"
                    min="0"
                    className="input font-mono bg-brand-500/5 text-brand-300 border-brand-500/30"
                    placeholder="Cantidad inicial en almacén"
                    value={editingItem.initialStock}
                    onChange={(e) => setEditingItem({ ...editingItem, initialStock: Number(e.target.value) })}
                  />
                </Field>
              )}

              <Field label="Estado">
                <select
                  className="select"
                  value={editingItem.active ? "1" : "0"}
                  onChange={(e) => setEditingItem({ ...editingItem, active: e.target.value === "1" })}
                >
                  <option value="1">Activo / Disponible</option>
                  <option value="0">Desactivado / Descontinuado</option>
                </select>
              </Field>

              <Field label="Descripción / Notas" full>
                <textarea
                  rows={2}
                  className="textarea"
                  placeholder="Notas internas sobre almacenamiento, uso, etc."
                  value={editingItem.description ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button className="btn btn-outline" onClick={() => setEditingItem(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveItem} disabled={saving}>
                {saving ? "Guardando..." : "Guardar Artículo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUST MODAL */}
      {adjustingStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center p-4 z-50 animate-fade-in" onClick={() => setAdjustingStock(null)}>
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative space-y-5" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="heading-md flex items-center gap-1.5">
                {adjustingStock.type === "in" && <ArrowUpRight className="text-emerald-400 size-5" />}
                {adjustingStock.type === "out" && <ArrowDownLeft className="text-rose-400 size-5" />}
                {adjustingStock.type === "adjustment" && <Scale className="text-sky-400 size-5" />}
                {adjustingStock.type === "in" && "Registrar Entrada"}
                {adjustingStock.type === "out" && "Registrar Salida"}
                {adjustingStock.type === "adjustment" && "Ajuste Manual"}
              </h2>
              <button onClick={() => setAdjustingStock(null)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-white/80">
                Artículo: <span className="font-bold text-white">{adjustingStock.itemName}</span>
              </p>

              <Field label={`Cantidad (${adjustingStock.itemUnit})`}>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  className="input font-mono"
                  placeholder="ej. 5.5, 10, 1"
                  value={adjustingStock.quantity || ""}
                  onChange={(e) => setAdjustingStock({ ...adjustingStock, quantity: Number(e.target.value) })}
                />
              </Field>

              <Field label="Motivo / Nota (Obligatorio)">
                <textarea
                  rows={3}
                  className="textarea"
                  placeholder={
                    adjustingStock.type === "in"
                      ? "ej. Compra a Grimco, orden de compra #1029"
                      : adjustingStock.type === "out"
                      ? "ej. Consumo en proyecto #3168 (Rotulación)"
                      : "ej. Inventario físico anual, ajuste de merma"
                  }
                  value={adjustingStock.note}
                  onChange={(e) => setAdjustingStock({ ...adjustingStock, note: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button className="btn btn-outline" onClick={() => setAdjustingStock(null)}>Cancelar</button>
              <button 
                className={`btn ${
                  adjustingStock.type === "in" 
                    ? "btn-primary bg-emerald-600 hover:bg-emerald-700" 
                    : adjustingStock.type === "out" 
                    ? "btn-primary bg-rose-600 hover:bg-rose-700" 
                    : "btn-primary"
                }`}
                onClick={saveStockAdjustment}
                disabled={saving}
              >
                {saving ? "Procesando..." : "Confirmar Ajuste"}
              </button>
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
      <label className="text-sm font-medium block mb-1 text-white/70">{label}</label>
      {children}
    </div>
  );
}
