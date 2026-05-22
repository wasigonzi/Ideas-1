"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { BlockShell, Field, TextField, ColorField, SelectField, ToggleField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor, ImageField } from "../shared";

const BRAND = "#ffae00";

/* Inline keyframes injected once */
const KEYFRAMES = `
@keyframes lb-backdrop { from { opacity: 0 } to { opacity: 1 } }
@keyframes lb-image    { from { opacity: 0; transform: scale(.93) } to { opacity: 1; transform: scale(1) } }
@keyframes lb-glow     {
  0%   { opacity: 0;   transform: scale(.6); }
  40%  { opacity: .55; transform: scale(1.05); }
  100% { opacity: .18; transform: scale(1); }
}
`;

function useInjectStyles(css: string) {
  useEffect(() => {
    const id = "__lb_keyframes__";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }, [css]);
}

interface GalleryImage { src: string; alt: string; caption?: string }

function Lightbox({ images, index, onClose }: { images: GalleryImage[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  const [imgKey, setImgKey] = useState(0); // re-trigger image animation on change
  useInjectStyles(KEYFRAMES);

  const prev = useCallback(() => { setCurrent((i) => (i - 1 + images.length) % images.length); setImgKey((k) => k + 1); }, [images.length]);
  const next = useCallback(() => { setCurrent((i) => (i + 1) % images.length); setImgKey((k) => k + 1); }, [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const img = images[current];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
      style={{ animation: "lb-backdrop .3s ease both", background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      {/* Brand glow burst — animates in from centre */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "70vmin",
            height: "70vmin",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRAND}cc 0%, ${BRAND}44 35%, transparent 70%)`,
            animation: "lb-glow .55s cubic-bezier(.22,1,.36,1) both",
          }}
        />
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full text-white transition z-10"
        style={{ background: "rgba(255,174,0,.15)", border: "1px solid rgba(255,174,0,.3)" }}
        aria-label="Cerrar"
      >
        <X size={22} />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 p-3 rounded-full text-white transition z-10"
          style={{ background: "rgba(255,174,0,.12)", border: "1px solid rgba(255,174,0,.25)" }}
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image + caption */}
      <div
        className="relative max-w-[90vw] max-h-[88vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={imgKey}
          src={img.src}
          alt={img.alt}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl"
          style={{
            animation: "lb-image .35s cubic-bezier(.22,1,.36,1) both",
            boxShadow: `0 0 60px 12px rgba(255,174,0,.25), 0 25px 60px rgba(0,0,0,.7)`,
          }}
        />
        {img.caption && (
          <p className="text-white/80 text-sm font-medium">{img.caption}</p>
        )}
        {images.length > 1 && (
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setImgKey((k) => k + 1); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === current ? BRAND : "rgba(255,255,255,0.3)",
                  transform: i === current ? "scale(1.3)" : "scale(1)",
                  boxShadow: i === current ? `0 0 6px ${BRAND}` : "none",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 p-3 rounded-full text-white transition z-10"
          style={{ background: "rgba(255,174,0,.12)", border: "1px solid rgba(255,174,0,.25)" }}
          aria-label="Siguiente"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}

export const galleryDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  title: "Galería de proyectos",
  titleColor: "#ffffff",
  accentColor: "#ffae00",
  columns: "3",
  gap: "4",
  rounded: true,
  images: [
    { src: "https://static.showit.co/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg", alt: "Letras 3D", caption: "Letras 3D corporativas" },
    { src: "https://static.showit.co/400/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png", alt: "Proyecto", caption: "Rotulación comercial" },
  ] as GalleryImage[],
};

export function GalleryBlock(props: Record<string, unknown>) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const images = (props.images as GalleryImage[]) || [];
  const cols = (props.columns as string) || "3";
  const gap = (props.gap as string) || "4";
  const accent = (props.accentColor as string) || "#ffae00";
  const gridCls: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-2 lg:grid-cols-4",
    "5": "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <BlockShell props={props}>
      {props.title && (
        <h2 data-sel-prop="title" className="text-3xl font-black text-center mb-8" style={{ color: (props.titleColor as string) || "#ffffff" }}>
          {props.title as string}
        </h2>
      )}
      <div className={`grid ${gridCls[cols] ?? "grid-cols-3"} gap-${gap}`}>
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className={`overflow-hidden group relative text-left ${props.rounded ? "rounded-xl" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
            aria-label={`Ver ${img.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white/90 text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full">
                Ver
              </span>
            </div>
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                style={{ background: `linear-gradient(to top, ${accent}dd, transparent)` }}>
                <p className="text-xs font-semibold text-white">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </BlockShell>
  );
}

export function GallerySettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  const images = (props.images as GalleryImage[]) || [];
  return (
    <div className="space-y-3">
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Columnas">
        <SelectField value={(props.columns as string) || "3"} onChange={(v) => onChange({ columns: v })}
          options={["2","3","4","5"].map((n) => ({ value: n, label: n }))} />
      </Field>
      <Field label="Separación">
        <SelectField value={(props.gap as string) || "4"} onChange={(v) => onChange({ gap: v })}
          options={["1","2","3","4","6","8"].map((n) => ({ value: n, label: `${n} × 4px` }))} />
      </Field>
      <Field label="Bordes redondeados" horizontal>
        <ToggleField value={!!(props.rounded)} onChange={(v) => onChange({ rounded: v })} />
      </Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>

      <SectionTitle>Imágenes</SectionTitle>
      <ArrayEditor
        items={images}
        onChange={(items) => onChange({ images: items })}
        defaultItem={{ src: "", alt: "", caption: "" }}
        addLabel="Añadir imagen"
        renderItem={(item, _idx, update, remove) => (
          <div className="p-2 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <ImageField value={item.src} onChange={(v) => update({ src: v })} />
            <Field label="Alt"><TextField value={item.alt} onChange={(v) => update({ alt: v })} /></Field>
            <Field label="Pie de foto"><TextField value={item.caption || ""} onChange={(v) => update({ caption: v })} /></Field>
            <button onClick={remove} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
          </div>
        )}
      />

      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
