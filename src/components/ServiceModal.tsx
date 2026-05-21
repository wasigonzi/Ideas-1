"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Images, ArrowUpRight } from "lucide-react";

export interface ServiceModalData {
  id: string;
  titleEs: string;
  titleEn?: string | null;
  descEs: string;
  descEn?: string | null;
  image?: string | null;
  gallery?: string | null;
}

function parseGallery(raw?: string | null): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

export function ServiceModal({
  service,
  locale,
  onClose,
}: {
  service: ServiceModalData;
  locale?: string;
  onClose: () => void;
}) {
  const title = locale === "en" ? (service.titleEn || service.titleEs) : service.titleEs;
  const desc  = locale === "en" ? (service.descEn  || service.descEs)  : service.descEs;

  const galleryUrls = parseGallery(service.gallery);
  const allImages = [...new Set(
    [service.image, ...galleryUrls].filter((u): u is string => !!u)
  )];

  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (idx === current || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 180);
  }, [current, transitioning]);

  const prev = useCallback(() => goTo((current - 1 + allImages.length) % allImages.length), [current, allImages.length, goTo]);
  const next = useCallback(() => goTo((current + 1) % allImages.length), [current, allImages.length, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(6,11,20,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #0e1625 0%, #060b14 100%)",
          border: "1px solid rgba(255,174,0,0.18)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,174,0,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero image zone ── */}
        <div className="relative shrink-0" style={{ height: "clamp(220px, 42vh, 380px)" }}>
          {allImages.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={allImages[current]}
                src={allImages[current]}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: transitioning ? 0 : 1,
                  transition: "opacity 0.18s ease",
                }}
              />
              {/* Cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-[#060b14]/30 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#060b14]/40 via-transparent to-transparent pointer-events-none" />

              {/* Counter badge */}
              {allImages.length > 1 && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/80"
                  style={{ background: "rgba(6,11,20,0.75)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                  <Images size={12} className="text-[var(--color-brand-500)]" />
                  {current + 1} / {allImages.length}
                </div>
              )}

              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                    style={{ background: "rgba(6,11,20,0.75)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}>
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                    style={{ background: "rgba(6,11,20,0.75)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}>
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </>
              )}

              {/* Title overlaid on hero */}
              <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-5 pt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-0.5 w-8 rounded-full" style={{ background: "var(--color-brand-500)" }} />
                      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--color-brand-500)" }}>
                        Servicio
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg">
                      {title}
                    </h2>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No image fallback */
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0e1625, #1a2540)" }}>
              <div className="text-3xl sm:text-4xl font-black text-white/10 select-none">{title}</div>
              <div className="mt-6 px-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-0.5 w-8 rounded-full" style={{ background: "var(--color-brand-500)" }} />
                  <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--color-brand-500)" }}>Servicio</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{title}</h2>
              </div>
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Description card */}
          <div className="px-6 sm:px-8 py-6">
            <p className="text-white/70 leading-relaxed text-base"
              style={{ borderLeft: "2px solid rgba(255,174,0,0.3)", paddingLeft: "1rem" }}>
              {desc}
            </p>
          </div>

          {/* Gallery grid */}
          {allImages.length > 1 && (
            <div className="px-6 sm:px-8 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <Images size={14} className="text-[var(--color-brand-500)]" />
                <span className="text-xs uppercase tracking-widest font-semibold text-white/40">
                  Galería · {allImages.length} fotos
                </span>
              </div>
              <div className={`grid gap-2 ${
                allImages.length === 2 ? "grid-cols-2" :
                allImages.length === 3 ? "grid-cols-3" :
                allImages.length <= 4 ? "grid-cols-2 sm:grid-cols-4" :
                "grid-cols-3 sm:grid-cols-4"
              }`}>
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="group relative rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      aspectRatio: "4/3",
                      outline: i === current ? "2px solid var(--color-brand-500)" : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className={`absolute inset-0 transition-all duration-200 ${
                      i === current
                        ? "bg-[var(--color-brand-500)]/10"
                        : "bg-black/0 group-hover:bg-black/20"
                    }`} />
                    {i === current && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-brand-500)", boxShadow: "0 0 8px var(--color-brand-500)" }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-6 sm:px-8 pb-7 pt-1">
            <div className="rounded-2xl p-4 flex items-center justify-between gap-4"
              style={{ background: "rgba(255,174,0,0.06)", border: "1px solid rgba(255,174,0,0.15)" }}>
              <p className="text-sm text-white/60">¿Interesado en este servicio?</p>
              <a
                href="/es/cotizacion"
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 hover:brightness-110"
                style={{ background: "var(--color-brand-500)", color: "var(--color-ink-950)" }}
              >
                Cotizar <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:rotate-90 active:scale-90"
          style={{ background: "rgba(6,11,20,0.80)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}
        >
          <X size={15} className="text-white/80" />
        </button>
      </div>
    </div>
  );
}
