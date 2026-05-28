"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  Check, FileCheck, FileImage, Loader2, Plus, Trash2, Upload, X, ZoomIn, ZoomOut,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ImageItem {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  w?: number;
  h?: number;
}

interface SheetPage {
  id: string;
  images: ImageItem[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const DOC_W = 1056;
const DOC_H = 816;
const IMG_AREA_H = 430;
const BOX_W = DOC_W - 48;
const BOX_H = IMG_AREA_H;

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ffae00]/50 transition-colors";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</label>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function SheetGenerator() {
  const today = new Date().toLocaleDateString("es-PR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const [numero, setNumero] = useState("");
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState(today);
  const [material, setMaterial] = useState("");
  const [terminacion, setTerminacion] = useState("");
  const [nota, setNota] = useState("");

  const [pages, setPages] = useState<SheetPage[]>([{ id: uid(), images: [] }]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const dragState = useRef<{
    id: string; startPx: number; startPy: number; startIx: number; startIy: number;
  } | null>(null);
  const resizeState = useRef<{
    id: string; startScale: number; startDist: number; centerPx: number; centerPy: number;
  } | null>(null);
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Page management ──────────────────────────────────────────────────────

  function addPage() {
    setPages((prev) => [...prev, { id: uid(), images: [] }]);
    setActivePageIdx(pages.length);
  }

  function removePage(idx: number) {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== idx));
    setActivePageIdx((prev) => Math.min(prev, pages.length - 2));
  }

  // ── Image management ──────────────────────────────────────────────────────

  function updatePage(fn: (p: SheetPage) => SheetPage) {
    setPages((prev) => prev.map((p, i) => (i === activePageIdx ? fn(p) : p)));
  }

  function addImageUrl(url: string) {
    const item: ImageItem = { id: uid(), url, x: 50, y: 50, scale: 1 };
    updatePage((p) => ({ ...p, images: [...p.images, item] }));
    setSelectedId(item.id);
  }

  function removeImage(id: string) {
    updatePage((p) => ({ ...p, images: p.images.filter((i) => i.id !== id) }));
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function setScale(id: string, scale: number) {
    updatePage((p) => ({
      ...p,
      images: p.images.map((i) => (i.id === id ? { ...i, scale: clamp(scale, 0.02, 10) } : i)),
    }));
  }

  function setImgDimensions(id: string, w: number, h: number) {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        images: p.images.map((i) => (i.id === id && !i.w ? { ...i, w, h } : i)),
      }))
    );
  }

  function alignImg(id: string, axis: "h" | "v", pos: "start" | "center" | "end") {
    updatePage((p) => ({
      ...p,
      images: p.images.map((i) => {
        if (i.id !== id) return i;
        const iw = (i.w ?? 200) * i.scale;
        const ih = (i.h ?? 200) * i.scale;
        if (axis === "h") {
          const x = pos === "start" ? (iw / 2 / BOX_W) * 100
            : pos === "end" ? 100 - (iw / 2 / BOX_W) * 100 : 50;
          return { ...i, x: clamp(x, 0, 100) };
        } else {
          const y = pos === "start" ? (ih / 2 / BOX_H) * 100
            : pos === "end" ? 100 - (ih / 2 / BOX_H) * 100 : 50;
          return { ...i, y: clamp(y, 0, 100) };
        }
      }),
    }));
  }

  function fitImg(id: string, type: "width" | "height" | "fill" | "contain") {
    updatePage((p) => ({
      ...p,
      images: p.images.map((i) => {
        if (i.id !== id || !i.w || !i.h) return i;
        const sw = BOX_W / i.w;
        const sh = BOX_H / i.h;
        const scale =
          type === "width" ? sw :
          type === "height" ? sh :
          type === "fill" ? Math.max(sw, sh) :
          Math.min(sw, sh);
        return { ...i, scale: clamp(scale, 0.02, 10), x: 50, y: 50 };
      }),
    }));
  }

  // ── Upload ───────────────────────────────────────────────────────────────

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "upload failed");
      addImageUrl(j.url as string);
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Export JPG ───────────────────────────────────────────────────────────

  async function exportJpg() {
    if (!exportContainerRef.current) return;
    setExporting(true);
    try {
      const h2c = (await import("html2canvas")).default;
      const kids = Array.from(exportContainerRef.current.children) as HTMLElement[];
      for (let i = 0; i < kids.length; i++) {
        const canvas = await h2c(kids[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: DOC_W,
          height: DOC_H,
        });
        const url = canvas.toDataURL("image/jpeg", 0.95);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hoja-${numero || "sin-numero"}-p${i + 1}.jpg`;
        a.click();
        if (i < kids.length - 1) await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      alert("Error al exportar imagen");
    } finally {
      setExporting(false);
    }
  }

  // ── Drag / resize ────────────────────────────────────────────────────────

  const onImgPointerDown = useCallback(
    (e: React.PointerEvent<HTMLImageElement>, id: string) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const activePage = pages[activePageIdx];
      const item = activePage?.images.find((i) => i.id === id);
      if (!item) return;
      dragState.current = { id, startPx: e.clientX, startPy: e.clientY, startIx: item.x, startIy: item.y };
      setSelectedId(id);
    },
    [pages, activePageIdx]
  );

  const onBoxPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, pageIdx: number) => {
      const r = resizeState.current;
      if (r) {
        const dist = Math.max(Math.hypot(e.clientX - r.centerPx, e.clientY - r.centerPy), 1);
        const newScale = clamp(r.startScale * (dist / r.startDist), 0.02, 10);
        setPages((prev) =>
          prev.map((p, i) =>
            i !== pageIdx ? p : {
              ...p,
              images: p.images.map((img) =>
                img.id !== r.id ? img : { ...img, scale: newScale }
              ),
            }
          )
        );
        return;
      }
      const d = dragState.current;
      if (!d) return;
      const box = boxRefs.current[pageIdx];
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const dx = ((e.clientX - d.startPx) / rect.width) * 100;
      const dy = ((e.clientY - d.startPy) / rect.height) * 100;
      setPages((prev) =>
        prev.map((p, i) =>
          i !== pageIdx ? p : {
            ...p,
            images: p.images.map((img) =>
              img.id !== d.id ? img : { ...img, x: clamp(d.startIx + dx, 0, 100), y: clamp(d.startIy + dy, 0, 100) }
            ),
          }
        )
      );
    },
    []
  );

  const onBoxPointerUp = useCallback(() => { dragState.current = null; resizeState.current = null; }, []);

  const onResizeHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string, pageIdx: number) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const pg = pages[pageIdx];
      const item = pg?.images.find((i) => i.id === id);
      if (!item) return;
      const box = boxRefs.current[pageIdx];
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const centerPx = rect.left + (item.x / 100) * rect.width;
      const centerPy = rect.top + (item.y / 100) * rect.height;
      const startDist = Math.max(Math.hypot(e.clientX - centerPx, e.clientY - centerPy), 1);
      resizeState.current = { id, startScale: item.scale, startDist, centerPx, centerPy };
      setSelectedId(id);
    },
    [pages]
  );

  const activePage = pages[activePageIdx];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-0 flex-1">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="lg:w-72 shrink-0 p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Datos del documento</p>

        <FormField label="No. Orden">
          <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="3480" className={inputCls} />
        </FormField>
        <FormField label="Cliente">
          <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" className={inputCls} />
        </FormField>
        <FormField label="Fecha">
          <input type="text" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Material">
          <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ej. Microperforado" className={inputCls} />
        </FormField>
        <FormField label="Terminación">
          <input type="text" value={terminacion} onChange={(e) => setTerminacion(e.target.value)} placeholder="Opcional" className={inputCls} />
        </FormField>
        <FormField label="Nota">
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} placeholder="Descripción o nota del arte" className={`${inputCls} resize-none`} />
        </FormField>

        {/* ── Page selector ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Páginas ({pages.length})</p>
            <button
              type="button"
              onClick={addPage}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-[#ffae00]/10 border border-[#ffae00]/30 text-[#ffae00] hover:bg-[#ffae00]/20"
            >
              <Plus size={11} /> Nueva página
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pages.map((pg, idx) => (
              <div key={pg.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActivePageIdx(idx)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    idx === activePageIdx
                      ? "bg-[#ffae00]/15 border-[#ffae00]/50 text-[#ffae00]"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  Pag {idx + 1}
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePage(idx)}
                    className="p-0.5 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Images panel ──────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
            Imágenes — Pag {activePageIdx + 1}
          </p>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#ffae00]/50 text-white/70 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>

          {activePage && activePage.images.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] text-white/35 uppercase tracking-wider">En el recuadro ({activePage.images.length})</p>
              {activePage.images.map((img, idx) => {
                const isSel = img.id === selectedId;
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedId(img.id)}
                    className={`rounded-lg border p-2 cursor-pointer transition-colors ${
                      isSel ? "border-[#ffae00]/60 bg-[#ffae00]/5" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      <span className="text-xs text-white/60 flex-1 truncate">Imagen {idx + 1}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {isSel && (
                      <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {/* Scale */}
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setScale(img.id, img.scale - 0.05)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60"><ZoomOut size={12} /></button>
                          <input
                            type="range" min="0.02" max="5" step="0.01" value={img.scale}
                            onChange={(e) => setScale(img.id, parseFloat(e.target.value))}
                            className="flex-1 h-1 accent-[#ffae00]"
                          />
                          <button type="button" onClick={() => setScale(img.id, img.scale + 0.05)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60"><ZoomIn size={12} /></button>
                          <span className="text-[10px] text-white/40 w-10 text-right">{(img.scale * 100).toFixed(0)}%</span>
                        </div>
                        {/* Align */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-white/35 w-12 shrink-0">Alinear</span>
                          <div className="flex gap-1 flex-1">
                            <button type="button" title="Izquierda" onClick={() => alignImg(img.id, "h", "start")} className="flex-1 flex justify-center p-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00]"><AlignLeft size={13} /></button>
                            <button type="button" title="Centro H" onClick={() => alignImg(img.id, "h", "center")} className="flex-1 flex justify-center p-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00]"><AlignCenter size={13} /></button>
                            <button type="button" title="Derecha" onClick={() => alignImg(img.id, "h", "end")} className="flex-1 flex justify-center p-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00]"><AlignRight size={13} /></button>
                            <div className="w-px bg-white/10 mx-0.5" />
                            <button type="button" title="Arriba" onClick={() => alignImg(img.id, "v", "start")} className="flex-1 flex justify-center p-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00]"><AlignStartVertical size={13} /></button>
                            <button type="button" title="Centro V" onClick={() => alignImg(img.id, "v", "center")} className="flex-1 flex justify-center p-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00]"><AlignCenterVertical size={13} /></button>
                            <button type="button" title="Abajo" onClick={() => alignImg(img.id, "v", "end")} className="flex-1 flex justify-center p-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00]"><AlignEndVertical size={13} /></button>
                          </div>
                        </div>
                        {/* Fit */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-white/35 w-12 shrink-0">Ajustar</span>
                          <div className="flex gap-1 flex-1">
                            {(["width", "height", "fill", "contain"] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => fitImg(img.id, type)}
                                disabled={!img.w}
                                className="flex-1 text-[10px] px-1 py-1 rounded bg-white/5 hover:bg-[#ffae00]/20 text-white/60 hover:text-[#ffae00] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                              >
                                {type === "width" ? "Ancho" : type === "height" ? "Alto" : type === "fill" ? "Llenar" : "Encajar"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Export button ─────────────────────────────────────────────── */}
        <button
          onClick={exportJpg}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl bg-[#ffae00] text-[#0a1422] hover:brightness-110 transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileImage size={16} />}
          {exporting ? "Exportando..." : "Descargar JPG"}
        </button>
      </div>

      {/* ── Preview canvas ───────────────────────────────────────────────── */}
      <div className="flex-1 p-5 overflow-auto bg-gray-300 flex flex-col items-center gap-4">
        {pages.map((page, idx) => (
          <div
            key={page.id}
            onClick={() => setActivePageIdx(idx)}
            className={`cursor-pointer rounded-lg overflow-hidden ring-2 transition-all ${
              idx === activePageIdx ? "ring-[#ffae00]" : "ring-transparent hover:ring-white/30"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-center py-1 bg-[#0d1422] text-white/50">
              Página {idx + 1}
            </div>
            <div
              style={{
                transform: "scale(0.65)",
                transformOrigin: "top center",
                width: DOC_W,
                marginBottom: `-${Math.round(DOC_H * 0.35)}px`,
              }}
            >
              <SheetDocument
                numero={numero} cliente={cliente} fecha={fecha}
                material={material} terminacion={terminacion} nota={nota}
                page={page}
                interactive={idx === activePageIdx}
                selectedId={selectedId}
                boxRef={(el) => { boxRefs.current[idx] = el; }}
                onImgPointerDown={onImgPointerDown}
                onImgLoad={setImgDimensions}
                onResizeHandlePointerDown={(e, id) => onResizeHandlePointerDown(e, id, idx)}
                onBoxPointerMove={(e) => onBoxPointerMove(e, idx)}
                onBoxPointerUp={onBoxPointerUp}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Off-screen render target for html2canvas */}
      {typeof document !== "undefined" && ReactDOM.createPortal(
        <div ref={exportContainerRef} style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}>
          {pages.map((page) => (
            <SheetDocument
              key={page.id}
              numero={numero} cliente={cliente} fecha={fecha}
              material={material} terminacion={terminacion} nota={nota}
              page={page}
            />
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Document renderer (same layout as ApprovalDocument in ApprovalSheet) ──

interface DocProps {
  numero: string;
  cliente: string;
  fecha: string;
  material: string;
  terminacion: string;
  nota: string;
  page: SheetPage;
  interactive?: boolean;
  selectedId?: string | null;
  boxRef?: (el: HTMLDivElement | null) => void;
  onImgLoad?: (id: string, w: number, h: number) => void;
  onImgPointerDown?: (e: React.PointerEvent<HTMLImageElement>, id: string) => void;
  onResizeHandlePointerDown?: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onBoxPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onBoxPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

function SheetDocument({
  numero, cliente, fecha, material, terminacion, nota, page,
  interactive = false, selectedId, boxRef, onImgLoad, onImgPointerDown, onResizeHandlePointerDown, onBoxPointerMove, onBoxPointerUp,
}: DocProps) {
  return (
    <div
      style={{
        width: DOC_W, minHeight: DOC_H, background: "#fff", color: "#000",
        fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px",
        padding: "20px 24px", boxSizing: "border-box",
        pageBreakAfter: "always", breakAfter: "page", display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ border: "2px solid #000", display: "flex", alignItems: "stretch", marginBottom: 0 }}>
        <div style={{ width: 160, borderRight: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 14px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/ideas-logo-full.png" alt="Ideas LLC" style={{ width: 136, height: "auto", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "stretch", borderBottom: "2px solid #000" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 16px", fontSize: "24px", fontWeight: 900, letterSpacing: "3px" }}>
              HOJA DE APROBACI&#211;N
            </div>
            <div style={{ width: 95, borderLeft: "2px solid #000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px" }}>No:</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#c00", lineHeight: 1 }}>{numero || "____"}</div>
            </div>
          </div>
          <div style={{ display: "flex", padding: "8px 16px", gap: "28px" }}>
            <div style={{ flex: 1 }}>
              <DocField label="Cliente" value={cliente} />
              <DocField label="Fecha" value={fecha} />
            </div>
            <div style={{ flex: 1 }}>
              <DocField label="Material" value={material} />
              <DocField label="Terminaci&#243;n" value={terminacion} />
            </div>
          </div>
        </div>
      </div>

      {/* NOTA bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", background: "#e8e8e8", border: "2px solid #000", borderTop: "none", marginBottom: 10, minHeight: 32 }}>
        <span style={{ fontWeight: 900, fontSize: "11px", marginRight: 10, background: "#222", color: "#fff", padding: "2px 8px", borderRadius: 3, letterSpacing: 1, whiteSpace: "nowrap" }}>NOTA:</span>
        <span style={{ fontWeight: 700, fontSize: "13px" }}>{nota || "\u00a0"}</span>
      </div>

      {/* Image box */}
      <div
        ref={interactive ? boxRef : undefined}
        onPointerMove={interactive ? onBoxPointerMove : undefined}
        onPointerUp={interactive ? onBoxPointerUp : undefined}
        onPointerLeave={interactive ? onBoxPointerUp : undefined}
        style={{
          border: "2px solid #ccc", borderRadius: 16, overflow: "hidden",
          height: IMG_AREA_H, flex: "none", position: "relative",
          background: page.images.length === 0 ? "#f8f8f8" : "#fff",
          marginBottom: 10, userSelect: "none",
        }}
      >
        {page.images.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: "14px", textAlign: "center", padding: "40px" }}>
            {interactive ? "Agrega im\u00e1genes desde el panel y arrastralas para posicionarlas" : "Sin imagen"}
          </div>
        )}
        {page.images.map((img) => (
          <div
            key={img.id}
            style={{
              position: "absolute",
              left: `${img.x}%`, top: `${img.y}%`,
              transform: `translate(-50%, -50%) scale(${img.scale})`,
              transformOrigin: "center center",
              display: "inline-flex",
              cursor: interactive ? "grab" : "default",
              touchAction: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt="Arte"
              draggable={false}
              onLoad={interactive ? (e) => {
                const el = e.currentTarget;
                onImgLoad?.(img.id, el.naturalWidth, el.naturalHeight);
              } : undefined}
              onPointerDown={interactive ? (e) => onImgPointerDown?.(e, img.id) : undefined}
              style={{
                display: "block", maxWidth: "none", width: "auto", height: "auto",
                outline: interactive && img.id === selectedId ? "3px solid #ffae00" : "none",
                outlineOffset: "2px", touchAction: "none", userSelect: "none",
              }}
            />
            {interactive && img.id === selectedId && (
              <div
                onPointerDown={(e) => { e.stopPropagation(); onResizeHandlePointerDown?.(e, img.id); }}
                style={{
                  position: "absolute", bottom: -7, right: -7,
                  width: 18, height: 18, background: "#ffae00",
                  border: "2.5px solid #000", borderRadius: 4,
                  cursor: "nwse-resize", touchAction: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)", zIndex: 10,
                }}
              />
            )}
          </div>
        ))}
        {interactive && page.images.length > 0 && (
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "10px", padding: "3px 8px", borderRadius: 6, pointerEvents: "none" }}>
            Arrastra las im&#225;genes para posicionarlas
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
        <div style={{ flex: 1, fontSize: "9.5px", lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700 }}>*FAVOR DE REVISAR</span> que todo este correcto antes de aprobar.
          Una vez aprobado el arte, el cliente se hace responsable de cualquier error u omision que tenga el mismo.{" "}
          <span style={{ fontWeight: 700 }}>*UNA VEZ APROBADO EL ARTE, TODO CAMBIO CONLLEVA UN COSTO ADICIONAL.</span>{" "}
          El tama&#241;o ilustrado no es tama&#241;o real y los colores pueden variar (+) o (-) en la impresi&#243;n.
        </div>
        <div style={{ width: 190, border: "1px solid #000", padding: "8px 14px", fontSize: "11px", lineHeight: 2.3, flexShrink: 0 }}>
          <div>FIRMA: <span style={{ borderBottom: "1px solid #000", display: "inline-block", width: 118 }}></span></div>
          <div>FECHA: <span style={{ borderBottom: "1px solid #000", display: "inline-block", width: 118 }}></span></div>
        </div>
      </div>

      {/* Confidentiality */}
      <div style={{ borderTop: "1px solid #ccc", paddingTop: 5, fontSize: "8.5px", color: "#555", lineHeight: 1.4 }}>
        <span style={{ fontWeight: 700 }}>AVISO DE CONFIDENCIALIDAD:</span> Todos los artes y contenido de esta cotizacion son creaciones propiedad de iDEAS LLC,
        Por lo que no pueden ser compartidas con terceros, replicadas o ejecutadas en el presente o futuro.
        Las descripciones de productos y servicios provistas solamente tienen un proposito ilustrativo y no deben de ser consideradas las descripciones de productos y servicios.
      </div>
    </div>
  );
}

function DocField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", paddingBottom: "2px", borderBottom: "1px solid #ccc" }}>
      <span style={{ fontWeight: 700, fontSize: "11px", whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ fontSize: "14px", fontWeight: 600, flex: 1 }}>{value || "\u00a0"}</span>
    </div>
  );
}
