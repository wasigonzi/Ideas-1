"use client";

import { useEffect, useState } from "react";
import type { Material } from "@prisma/client";
import { Calculator, Save } from "lucide-react";

type Quote = {
  squareFeet: number;
  materialCostPerSqFt: number;
  inkCostPerSqFt: number;
  materialCost: number;
  inkCost: number;
  baseCost: number;
  markup: number;
  price: number;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function CalculadoraPrecios() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [qty, setQty] = useState(1);
  const [finishing, setFinishing] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);

  // Parámetros globales editables.
  const [markup, setMarkup] = useState(2.5);
  const [ink, setInk] = useState(0.35);
  const [savingParams, setSavingParams] = useState(false);

  async function loadMaterials() {
    const r = await fetch("/api/materiales");
    setMaterials(r.ok ? await r.json() : []);
  }
  async function loadParams() {
    const r = await fetch("/api/precios");
    if (r.ok) {
      const p = await r.json();
      setMarkup(p.markup);
      setInk(p.inkCostPerSqFt);
    }
  }
  useEffect(() => {
    loadMaterials();
    loadParams();
  }, []);

  const sqftEach = (width / 12) * (height / 12); // pulgadas → pies²
  const totalSqft = sqftEach * Math.max(1, qty);

  async function calc() {
    if (!materialId) {
      alert("Selecciona un material");
      return;
    }
    const r = await fetch("/api/precios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialId,
        squareFeet: totalSqft,
        finishingCostPerSqFt: finishing,
      }),
    });
    if (!r.ok) {
      alert("Error al calcular");
      return;
    }
    setQuote(await r.json());
  }

  async function saveParams() {
    setSavingParams(true);
    const r = await fetch("/api/precios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markup, inkCostPerSqFt: ink }),
    });
    setSavingParams(false);
    if (!r.ok) {
      alert("Error al guardar parámetros");
      return;
    }
    alert("Parámetros guardados");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Calculadora de precios</h1>
      </div>

      {/* Parámetros globales */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Parámetros globales
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block text-gray-600">Margen (multiplicador)</span>
            <input
              type="number"
              step="0.1"
              min="1"
              value={markup}
              onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
              className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600">Costo tinta por pie²</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={ink}
              onChange={(e) => setInk(parseFloat(e.target.value) || 0)}
              className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <button
            onClick={saveParams}
            disabled={savingParams}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </section>

      {/* Calculadora */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm">
            <span className="text-gray-600">Material</span>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">— Selecciona —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({money(m.costPerSqFt)}/ft²)
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-gray-600">Ancho (pulg)</span>
              <input
                type="number"
                min="0"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Alto (pulg)</span>
              <input
                type="number"
                min="0"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Cantidad</span>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Terminación $/ft²</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finishing}
                onChange={(e) => setFinishing(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Área total: <strong>{totalSqft.toFixed(2)} ft²</strong>
          </p>
          <button
            onClick={calc}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            <Calculator className="h-4 w-4" />
            Calcular precio
          </button>
        </div>

        {/* Resultado */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Resultado</h2>
          {quote ? (
            <dl className="space-y-2 text-sm">
              <Row label="Material" value={money(quote.materialCost)} />
              <Row label="Tinta" value={money(quote.inkCost)} />
              <Row label="Costo base" value={money(quote.baseCost)} />
              <Row label="Margen" value={`×${quote.markup}`} />
              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                <dt className="font-semibold">Precio sugerido</dt>
                <dd className="text-xl font-bold text-green-600">
                  {money(quote.price)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">
              Completa los datos y calcula el precio.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
