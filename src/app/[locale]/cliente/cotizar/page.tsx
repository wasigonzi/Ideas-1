"use client";

import { useEffect, useState } from "react";
import { Calculator, CheckCircle2, Package, Wrench } from "lucide-react";

type Material = { id: string; name: string; category: string; thickness: string | null; unit: string };

type QuoteResult = {
  squareFeetEach: number;
  totalSqFt: number;
  qty: number;
  priceEach: number;
  totalPrice: number;
  pricePerSqFt: number;
  hasInstall: boolean;
  estimatedDelivery: string;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmt = (n: number, dec = 2) => n.toFixed(dec);

export default function ClientCotizar() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [widthIn, setWidthIn] = useState(24);
  const [heightIn, setHeightIn] = useState(36);
  const [qty, setQty] = useState(1);
  const [hasInstall, setHasInstall] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/cliente/materiales")
      .then((r) => r.json())
      .then(setMaterials)
      .catch(() => {});
  }, []);

  // Group materials by category
  const byCategory = materials.reduce<Record<string, Material[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  const sqftEach = (widthIn / 12) * (heightIn / 12);
  const totalSqft = sqftEach * Math.max(1, qty);

  async function calculate() {
    if (!materialId) { alert("Selecciona un material"); return; }
    setLoading(true);
    setSubmitted(false);
    setResult(null);
    try {
      const r = await fetch("/api/cliente/cotizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, widthIn, heightIn, qty, hasInstall }),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error ?? "Error al calcular"); return; }
      setResult(data);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  const selectedMat = materials.find((m) => m.id === materialId);

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="heading-lg">Calcular precio</h1>
        <p className="text-white/55 text-sm mt-1">
          Obtén un precio estimado al instante. Un asesor te contactará para confirmar los detalles.
        </p>
      </header>

      <div className="card p-6 space-y-5">
        {/* Material */}
        <div>
          <label className="text-sm font-medium block mb-1">Material <span className="text-red-400">*</span></label>
          <select
            className="select w-full"
            value={materialId}
            onChange={(e) => { setMaterialId(e.target.value); setResult(null); }}
          >
            <option value="">Selecciona un material...</option>
            {Object.entries(byCategory).map(([cat, mats]) => (
              <optgroup key={cat} label={cat.toUpperCase()}>
                {mats.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.thickness ? ` (${m.thickness})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Dimensiones */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Ancho (pulgadas)</label>
            <input
              type="number"
              min={1}
              max={600}
              className="input w-full"
              value={widthIn}
              onChange={(e) => { setWidthIn(Math.max(1, Number(e.target.value))); setResult(null); }}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Alto (pulgadas)</label>
            <input
              type="number"
              min={1}
              max={600}
              className="input w-full"
              value={heightIn}
              onChange={(e) => { setHeightIn(Math.max(1, Number(e.target.value))); setResult(null); }}
            />
          </div>
        </div>

        {/* Cantidad */}
        <div>
          <label className="text-sm font-medium block mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            max={9999}
            className="input w-full"
            value={qty}
            onChange={(e) => { setQty(Math.max(1, Math.floor(Number(e.target.value)))); setResult(null); }}
          />
        </div>

        {/* Tipo de trabajo */}
        <div>
          <label className="text-sm font-medium block mb-2">Tipo de trabajo</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setHasInstall(false); setResult(null); }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
                !hasInstall
                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/15 text-[var(--color-brand-300)]"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              <Package size={16} />
              <span>Sin instalación</span>
            </button>
            <button
              type="button"
              onClick={() => { setHasInstall(true); setResult(null); }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
                hasInstall
                  ? "border-sky-500 bg-sky-500/15 text-sky-300"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              <Wrench size={16} />
              <span>Con instalación</span>
            </button>
          </div>
        </div>

        {/* Resumen previo */}
        {materialId && (
          <div className="bg-white/5 rounded-lg p-3 text-xs text-white/55 flex flex-wrap gap-x-4 gap-y-1">
            <span>Material: <strong className="text-white/80">{selectedMat?.name}</strong></span>
            <span>Tamaño: <strong className="text-white/80">{widthIn}"×{heightIn}"</strong></span>
            <span>Área c/u: <strong className="text-white/80">{fmt(sqftEach)} ft²</strong></span>
            <span>Total: <strong className="text-white/80">{fmt(totalSqft)} ft²</strong></span>
          </div>
        )}

        <button
          className="btn btn-primary w-full"
          onClick={calculate}
          disabled={loading || !materialId}
        >
          <Calculator size={16} />
          {loading ? "Calculando..." : "Calcular precio"}
        </button>
      </div>

      {/* Resultado */}
      {result && submitted && (
        <div className="card p-6 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <h2 className="font-semibold">Cotización estimada</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs uppercase text-white/45 mb-1">Precio por pieza</div>
              <div className="text-2xl font-bold">{money(result.priceEach)}</div>
              <div className="text-xs text-white/40 mt-0.5">{money(result.pricePerSqFt)}/ft²</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs uppercase text-white/45 mb-1">Total ({result.qty} pieza{result.qty === 1 ? "" : "s"})</div>
              <div className="text-2xl font-bold text-emerald-400">{money(result.totalPrice)}</div>
              <div className="text-xs text-white/40 mt-0.5">{fmt(result.totalSqFt)} ft² total</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/65">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${result.hasInstall ? "bg-sky-500/15 text-sky-300" : "bg-slate-500/15 text-slate-300"}`}>
              {result.hasInstall ? <Wrench size={12} /> : <Package size={12} />}
              {result.hasInstall ? "Con instalación" : "Sin instalación"}
            </span>
            <span className="text-white/50">
              Entrega estimada:{" "}
              <strong className="text-white/80">
                {new Date(result.estimatedDelivery + "T12:00:00").toLocaleDateString("es-PR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </strong>
            </span>
          </div>

          <p className="text-xs text-white/35 mt-4">
            * Precio estimado. Un asesor de Ideas PR se comunicará contigo para confirmar disponibilidad, medidas finales y opciones de terminación. Los precios están sujetos a cambio según especificaciones finales.
          </p>
        </div>
      )}
    </div>
  );
}
