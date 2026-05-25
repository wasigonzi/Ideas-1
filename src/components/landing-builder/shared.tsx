"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, ChevronDown, Link2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import React from "react";

// ── Video URL helper ───────────────────────────────────────────────────────
function isBgVideoEmbed(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com");
}

function getBgVideoEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v") || "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&playsinline=1`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop() || "";
      return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1`;
    }
  } catch { /* fall through */ }
  return url;
}

// ── Field wrapper ──────────────────────────────────────────────────────────
export function Field({
  label,
  children,
  horizontal,
}: {
  label: string;
  children: React.ReactNode;
  horizontal?: boolean;
}) {
  return (
    <div className={horizontal ? "flex items-center justify-between gap-3" : "space-y-1.5"}>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 shrink-0">
        {label}
      </label>
      <div className={horizontal ? "flex-1 min-w-0" : ""}>{children}</div>
    </div>
  );
}

// ── Text input ─────────────────────────────────────────────────────────────
export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)]";
  if (multiline)
    return (
      <textarea
        className={cls + " resize-none"}
        rows={rows ?? 3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  return (
    <input
      type="text"
      className={cls}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// ── URL input ──────────────────────────────────────────────────────────────
export function UrlField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)]"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "https://..."}
    />
  );
}

// ── Color picker ───────────────────────────────────────────────────────────
export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // <input type="color"> only accepts #rrggbb — convert rgba/other formats for the swatch
  const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value);
  const swatchValue = isHex ? value.slice(0, 7) : "#000000";
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 rounded-md border border-white/15 overflow-hidden shrink-0 cursor-pointer">
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <div className="w-full h-full" style={{ background: value || "#000000" }} />
      </div>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg bg-white/6 border border-white/10 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--color-brand-400)]"
        placeholder="#000000 or rgba(...)"
      />
    </div>
  );
}

// ── Number input ───────────────────────────────────────────────────────────
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 rounded-lg bg-white/6 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand-400)]"
      />
      {unit && <span className="text-xs text-white/40 shrink-0">{unit}</span>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
export function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-brand-400)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-gray-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────
export function ToggleField({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative flex items-center gap-2 select-none cursor-pointer"
    >
      <div
        className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-[var(--color-brand-500)]" : "bg-white/15"}`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform m-0.5 ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      {label && <span className="text-sm text-white/70">{label}</span>}
    </button>
  );
}

// ── Slider ─────────────────────────────────────────────────────────────────
export function SliderField({
  value,
  onChange,
  min = 0,
  max = 100,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--color-brand-500)]"
      />
      <span className="text-sm text-white/70 w-12 text-right shrink-0">
        {value}
        {unit}
      </span>
    </div>
  );
}

// ── Image picker ───────────────────────────────────────────────────────────
export function ImageField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50">
          {label}
        </label>
      )}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="w-full h-20 object-cover rounded-lg border border-white/10"
        />
      )}
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)]"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        className="btn btn-outline text-xs w-full flex items-center justify-center gap-2"
      >
        {uploading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Upload size={12} />
        )}
        {uploading ? "Subiendo…" : "Subir imagen"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 pt-4 pb-1 border-t border-white/8 mt-3 first:border-t-0 first:pt-0">
      {children}
    </div>
  );
}

// ── Accordion section ──────────────────────────────────────────────────────
export function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/8 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors"
      >
        {title}
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-3 space-y-3">{children}</div>}
    </div>
  );
}

// ── Background style util ──────────────────────────────────────────────────
export function getBgStyle(props: Record<string, unknown>): React.CSSProperties {
  const bt = (props.bgType as string) || "none";
  if (bt === "color") return { background: (props.bgColor as string) || "#0f172a" };
  if (bt === "image")
    return {
      backgroundImage: `url(${props.bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  if (bt === "gradient") {
    const from = (props.bgGradFrom as string) || "#1e1b4b";
    const to = (props.bgGradTo as string) || "#0f172a";
    const angle = (props.bgGradAngle as number) ?? 135;
    return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
  }
  // video: no CSS background, handled by <video>/<iframe> element
  return {};
}

// ── Block shell (bg + spacing wrapper) ────────────────────────────────────
export function BlockShell({
  props,
  children,
  className,
}: {
  props: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
}) {
  const padTop = (props.padTop as number) ?? 80;
  const padBottom = (props.padBottom as number) ?? 80;
  const padLeft = (props.padLeft as number) ?? 0;
  const padRight = (props.padRight as number) ?? 0;
  const marginTop = (props.marginTop as number) ?? 0;
  const marginBottom = (props.marginBottom as number) ?? 0;
  const maxW = (props.maxWidth as string) || "1200px";
  const bgStyle = getBgStyle(props);
  const hideOnMobile = props.hideOnMobile as boolean | undefined;
  const hideOnDesktop = props.hideOnDesktop as boolean | undefined;

  // Border
  const borderWidth = (props.borderWidth as number) ?? 0;
  const borderStyle = (props.borderStyle as string) || "solid";
  const borderColor = (props.borderColor as string) || "rgba(255,255,255,0.2)";

  // Border radius
  const linked = (props.borderRadiusLinked as boolean) ?? true;
  const radius = (props.borderRadius as number) ?? 0;
  const tl = linked ? radius : ((props.borderRadiusTL as number) ?? 0);
  const tr = linked ? radius : ((props.borderRadiusTR as number) ?? 0);
  const bl = linked ? radius : ((props.borderRadiusBL as number) ?? 0);
  const br = linked ? radius : ((props.borderRadiusBR as number) ?? 0);

  // Effects
  const boxShadow = (props.boxShadow as string) || "";
  const opacity = (props.opacity as number) ?? 100;
  const zIndex = props.zIndex as number | undefined;
  const customClass = (props.customClass as string) || "";
  const customId = (props.customId as string) || "";

  const visibility =
    hideOnMobile && hideOnDesktop
      ? "hidden"
      : hideOnMobile
      ? "hidden md:block"
      : hideOnDesktop
      ? "md:hidden"
      : "";

  const bgType = (props.bgType as string) || "none";
  const bgVideoUrl = (props.bgVideoUrl as string) || "";
  const isEmbed = bgVideoUrl ? isBgVideoEmbed(bgVideoUrl) : false;
  const embedUrl = isEmbed ? getBgVideoEmbedUrl(bgVideoUrl) : "";
  const minHeight = (props.minHeight as number) ?? undefined;

  return (
    <section
      id={customId || undefined}
      className={`relative overflow-hidden ${visibility} ${customClass} ${className ?? ""}`}
      style={{
        ...bgStyle,
        paddingTop: padTop,
        paddingBottom: padBottom,
        ...(padLeft ? { paddingLeft: padLeft } : {}),
        ...(padRight ? { paddingRight: padRight } : {}),
        ...(marginTop ? { marginTop } : {}),
        ...(marginBottom ? { marginBottom } : {}),
        ...(borderWidth ? { borderWidth, borderStyle, borderColor } : {}),
        ...(tl ? { borderTopLeftRadius: tl } : {}),
        ...(tr ? { borderTopRightRadius: tr } : {}),
        ...(bl ? { borderBottomLeftRadius: bl } : {}),
        ...(br ? { borderBottomRightRadius: br } : {}),
        ...(boxShadow ? { boxShadow } : {}),
        ...(opacity < 100 ? { opacity: opacity / 100 } : {}),
        ...(zIndex !== undefined ? { zIndex } : {}),
        ...(minHeight ? { minHeight } : {}),
      }}
    >
      {/* Video background */}
      {bgType === "video" && bgVideoUrl && (
        isEmbed ? (
          <iframe
            src={embedUrl}
            allow="autoplay; fullscreen"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ border: "none", objectFit: "cover", transform: "scale(1.1)" }}
            title="bg-video"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={bgVideoUrl} />
          </video>
        )
      )}
      {/* Overlay for image or video */}
      {(bgType === "image" || bgType === "video") && props.bgOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: (props.bgOverlayColor as string) || "#000000",
            opacity: ((props.bgOverlayOpacity as number) ?? 50) / 100,
          }}
        />
      )}
      {/* Content */}
      <div
        className="relative px-4 sm:px-6"
        style={{ maxWidth: maxW === "full" ? undefined : maxW, margin: "0 auto" }}
      >
        {children}
      </div>
    </section>
  );
}

// ── Video bg field (URL + direct upload) ──────────────────────────────────
function VideoBgField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
    } catch {
      alert("Error al subir video");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50">
        URL o archivo de video
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... (MP4, WebM, YouTube, Vimeo)"
        className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)]"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        className="btn btn-outline text-xs w-full flex items-center justify-center gap-2"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {uploading ? "Subiendo…" : "Subir video (MP4/WebM)"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="video/mp4,video/webm,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {value && !value.includes("youtube") && !value.includes("vimeo") && (
        <video src={value} className="w-full rounded-lg h-20 object-cover border border-white/10" muted playsInline />
      )}
      <p className="text-[10px] text-white/30">YouTube y Vimeo se reproducen automáticamente en loop sin controles.</p>
    </div>
  );
}

// ── Background settings ────────────────────────────────────────────────────
export function BgSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const bg = (props.bgType as string) || "none";
  return (
    <div className="space-y-3">
      <Field label="Tipo de fondo">
        <SelectField
          value={bg}
          onChange={(v) => onChange({ bgType: v })}
          options={[
            { value: "none", label: "Ninguno" },
            { value: "color", label: "Color sólido" },
            { value: "image", label: "Imagen" },
            { value: "gradient", label: "Gradiente" },
            { value: "video", label: "Video" },
          ]}
        />
      </Field>
      {bg === "color" && (
        <Field label="Color">
          <ColorField
            value={(props.bgColor as string) || "#0f172a"}
            onChange={(v) => onChange({ bgColor: v })}
          />
        </Field>
      )}
      {bg === "image" && (
        <>
          <ImageField
            label="Imagen de fondo"
            value={(props.bgImage as string) || ""}
            onChange={(v) => onChange({ bgImage: v })}
          />
          <Field label="Overlay" horizontal>
            <ToggleField
              value={!!(props.bgOverlay)}
              onChange={(v) => onChange({ bgOverlay: v })}
            />
          </Field>
          {props.bgOverlay && (
            <>
              <Field label="Color overlay">
                <ColorField
                  value={(props.bgOverlayColor as string) || "#000000"}
                  onChange={(v) => onChange({ bgOverlayColor: v })}
                />
              </Field>
              <Field label="Opacidad">
                <SliderField
                  value={(props.bgOverlayOpacity as number) ?? 50}
                  onChange={(v) => onChange({ bgOverlayOpacity: v })}
                  unit="%"
                />
              </Field>
            </>
          )}
        </>
      )}
      {bg === "gradient" && (
        <>
          <Field label="Color inicio">
            <ColorField
              value={(props.bgGradFrom as string) || "#1e1b4b"}
              onChange={(v) => onChange({ bgGradFrom: v })}
            />
          </Field>
          <Field label="Color fin">
            <ColorField
              value={(props.bgGradTo as string) || "#0f172a"}
              onChange={(v) => onChange({ bgGradTo: v })}
            />
          </Field>
          <Field label="Ángulo">
            <NumberField
              value={(props.bgGradAngle as number) ?? 135}
              onChange={(v) => onChange({ bgGradAngle: v })}
              unit="°"
              min={0}
              max={360}
            />
          </Field>
        </>
      )}
      {bg === "video" && (
        <>
          <VideoBgField
            value={(props.bgVideoUrl as string) || ""}
            onChange={(v) => onChange({ bgVideoUrl: v })}
          />
          <Field label="Overlay" horizontal>
            <ToggleField
              value={!!(props.bgOverlay)}
              onChange={(v) => onChange({ bgOverlay: v })}
            />
          </Field>
          {props.bgOverlay && (
            <>
              <Field label="Color overlay">
                <ColorField
                  value={(props.bgOverlayColor as string) || "#000000"}
                  onChange={(v) => onChange({ bgOverlayColor: v })}
                />
              </Field>
              <Field label="Opacidad">
                <SliderField
                  value={(props.bgOverlayOpacity as number) ?? 50}
                  onChange={(v) => onChange({ bgOverlayOpacity: v })}
                  unit="%"
                />
              </Field>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Spacing settings ───────────────────────────────────────────────────────
export function SpacingSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const pt = (props.padTop as number) ?? 80;
  const pb = (props.padBottom as number) ?? 80;
  const pl = (props.padLeft as number) ?? 0;
  const pr = (props.padRight as number) ?? 0;
  const mt = (props.marginTop as number) ?? 0;
  const mb = (props.marginBottom as number) ?? 0;

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-white/35 uppercase tracking-wider font-semibold">Padding (px)</div>
      <FourSideField
        values={[pt, pr, pb, pl]}
        onChange={([t, r, b, l]) => onChange({ padTop: t, padRight: r, padBottom: b, padLeft: l })}
        labels={["↑", "→", "↓", "←"]}
      />
      <div className="text-[10px] text-white/35 uppercase tracking-wider font-semibold pt-1">Margen (px)</div>
      <FourSideField
        values={[mt, 0, mb, 0]}
        onChange={([t, , b]) => onChange({ marginTop: t, marginBottom: b })}
        labels={["↑", "—", "↓", "—"]}
        disabledIdx={[1, 3]}
      />
      <Field label="Ancho máximo">
        <SelectField
          value={(props.maxWidth as string) || "1200px"}
          onChange={(v) => onChange({ maxWidth: v })}
          options={[
            { value: "full", label: "Completo" },
            { value: "1400px", label: "1400px" },
            { value: "1200px", label: "1200px (default)" },
            { value: "960px", label: "960px" },
            { value: "720px", label: "720px" },
          ]}
        />
      </Field>
    </div>
  );
}

// ── Four-side field ────────────────────────────────────────────────────────
export function FourSideField({
  values,
  onChange,
  min = 0,
  unit = "px",
  labels = ["↑", "→", "↓", "←"],
  disabledIdx = [],
}: {
  values: [number, number, number, number];
  onChange: (v: [number, number, number, number]) => void;
  min?: number;
  unit?: string;
  labels?: [string, string, string, string];
  disabledIdx?: number[];
}) {
  const [linked, setLinked] = useState(
    values[0] === values[1] && values[1] === values[2] && values[2] === values[3]
  );

  function set(idx: number, v: number) {
    if (linked) {
      onChange([v, v, v, v]);
    } else {
      const next = [...values] as [number, number, number, number];
      next[idx] = v;
      onChange(next);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1">
        {values.map((v, i) => (
          <div key={i} className="space-y-1">
            <div className="text-[10px] text-white/35 text-center select-none">{labels[i]}</div>
            <input
              type="number"
              min={min}
              disabled={disabledIdx.includes(i)}
              value={v}
              onChange={(e) => set(i, Number(e.target.value))}
              className="w-full rounded-md bg-white/6 border border-white/10 px-1 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[var(--color-brand-400)] disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLinked(!linked)}
          className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border transition-colors ${
            linked
              ? "border-[var(--color-brand-400)]/40 text-[var(--color-brand-400)] bg-[var(--color-brand-400)]/10"
              : "border-white/10 text-white/40 hover:text-white/60"
          }`}
        >
          <Link2 size={10} /> {linked ? "Enlazado" : "Enlazar"}
        </button>
        <span className="text-[10px] text-white/30">{unit}</span>
      </div>
    </div>
  );
}

// ── Border settings ────────────────────────────────────────────────────────
export function BorderSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const width = (props.borderWidth as number) ?? 0;
  const style = (props.borderStyle as string) || "solid";
  const color = (props.borderColor as string) || "rgba(255,255,255,0.2)";
  const linked = (props.borderRadiusLinked as boolean) ?? true;
  const radius = (props.borderRadius as number) ?? 0;
  const tl = linked ? radius : ((props.borderRadiusTL as number) ?? 0);
  const tr = linked ? radius : ((props.borderRadiusTR as number) ?? 0);
  const bl = linked ? radius : ((props.borderRadiusBL as number) ?? 0);
  const br = linked ? radius : ((props.borderRadiusBR as number) ?? 0);

  return (
    <div className="space-y-3">
      {/* Border line */}
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <div className="text-[10px] text-white/35 mb-1.5">Grosor</div>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0}
              value={width}
              onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
              className="w-full rounded-md bg-white/6 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand-400)]"
            />
            <span className="text-[10px] text-white/30">px</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-white/35 mb-1.5">Estilo</div>
          <SelectField
            value={style}
            onChange={(v) => onChange({ borderStyle: v })}
            options={[
              { value: "solid", label: "Sólido" },
              { value: "dashed", label: "Guiones" },
              { value: "dotted", label: "Puntos" },
              { value: "double", label: "Doble" },
            ]}
          />
        </div>
        <div>
          <div className="text-[10px] text-white/35 mb-1.5">Color</div>
          <ColorField value={color} onChange={(v) => onChange({ borderColor: v })} />
        </div>
      </div>

      {/* Border radius */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/35 uppercase tracking-wider font-semibold">Radio de borde</span>
          <button
            type="button"
            onClick={() => onChange({ borderRadiusLinked: !linked })}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
              !linked
                ? "border-[var(--color-brand-400)]/40 text-[var(--color-brand-400)] bg-[var(--color-brand-400)]/10"
                : "border-white/10 text-white/40"
            }`}
          >
            Por esquina
          </button>
        </div>
        {/* Preset chips */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {[0, 4, 8, 16, 24, 9999].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ borderRadius: r, borderRadiusTL: r, borderRadiusTR: r, borderRadiusBL: r, borderRadiusBR: r, borderRadiusLinked: true })}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                linked && radius === r
                  ? "border-[var(--color-brand-400)]/50 text-[var(--color-brand-400)] bg-[var(--color-brand-400)]/10"
                  : "border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {r === 9999 ? "Pill" : r === 0 ? "□" : `${r}`}
            </button>
          ))}
        </div>
        {linked ? (
          <SliderField
            value={radius}
            onChange={(v) => onChange({ borderRadius: v, borderRadiusTL: v, borderRadiusTR: v, borderRadiusBL: v, borderRadiusBR: v })}
            min={0} max={100} unit="px"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(["TL", "TR", "BL", "BR"] as const).map((corner, i) => {
              const key = `borderRadius${corner}` as string;
              const val = [tl, tr, bl, br][i];
              return (
                <div key={corner} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/35 w-5 shrink-0">{corner}</span>
                  <input
                    type="number" min={0}
                    value={val}
                    onChange={(e) => onChange({ [key]: Number(e.target.value) })}
                    className="w-full rounded-md bg-white/6 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand-400)]"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shadow presets ─────────────────────────────────────────────────────────
const SHADOW_PRESETS = [
  { label: "Ninguna", value: "" },
  { label: "Sutil", value: "0 2px 8px rgba(0,0,0,0.15)" },
  { label: "Media", value: "0 4px 24px rgba(0,0,0,0.28)" },
  { label: "Grande", value: "0 8px 48px rgba(0,0,0,0.42)" },
  { label: "XL", value: "0 20px 80px rgba(0,0,0,0.55)" },
  { label: "Glow", value: "0 0 40px rgba(255,174,0,0.35)" },
];

export function ShadowSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const shadow = (props.boxShadow as string) || "";
  const isPreset = SHADOW_PRESETS.some((p) => p.value === shadow);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {SHADOW_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange({ boxShadow: p.value })}
            className={`py-1.5 px-2 rounded-lg text-[10px] border transition-colors ${
              shadow === p.value
                ? "border-[var(--color-brand-400)]/50 text-[var(--color-brand-400)] bg-[var(--color-brand-400)]/10"
                : "border-white/10 text-white/50 hover:border-white/30"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Field label="Sombra personalizada">
        <TextField
          value={shadow}
          onChange={(v) => onChange({ boxShadow: v })}
          placeholder="0 4px 24px rgba(0,0,0,0.25)"
        />
      </Field>
    </div>
  );
}

// ── Filter / effects settings ─────────────────────────────────────────────
export function FilterSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const opacity = (props.opacity as number) ?? 100;
  return (
    <div className="space-y-3">
      <Field label="Opacidad">
        <SliderField value={opacity} onChange={(v) => onChange({ opacity: v })} min={0} max={100} unit="%" />
      </Field>
    </div>
  );
}

// ── Typography settings (reusable per-block) ───────────────────────────────
export function TypographySettings({
  prefix = "",
  label,
  props,
  onChange,
}: {
  prefix?: string;
  label?: string;
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  // Build key with prefix (e.g. prefix="title" → "titleFontSize")
  const k = (name: string) =>
    prefix ? `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;

  const ALIGN_ICONS = [
    { val: "left", Icon: AlignLeft },
    { val: "center", Icon: AlignCenter },
    { val: "right", Icon: AlignRight },
    { val: "justify", Icon: AlignJustify },
  ] as const;

  return (
    <div className="space-y-3">
      {label && <SectionTitle>{label}</SectionTitle>}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tamaño (px)">
          <NumberField
            value={(props[k("fontSize")] as number) ?? 16}
            onChange={(v) => onChange({ [k("fontSize")]: v })}
            unit="px" min={8}
          />
        </Field>
        <Field label="Peso">
          <SelectField
            value={(props[k("fontWeight")] as string) || "700"}
            onChange={(v) => onChange({ [k("fontWeight")]: v })}
            options={[
              { value: "300", label: "Light" },
              { value: "400", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "700", label: "Bold" },
              { value: "800", label: "Extrabold" },
              { value: "900", label: "Black" },
            ]}
          />
        </Field>
      </div>
      <Field label="Fuente">
        <SelectField
          value={(props[k("fontFamily")] as string) || "inherit"}
          onChange={(v) => onChange({ [k("fontFamily")]: v })}
          options={[
            { value: "inherit", label: "Herencia" },
            { value: "sans-serif", label: "Sans-serif" },
            { value: "serif", label: "Serif" },
            { value: "monospace", label: "Mono" },
            { value: "'Inter', sans-serif", label: "Inter" },
            { value: "'Poppins', sans-serif", label: "Poppins" },
            { value: "'Playfair Display', serif", label: "Playfair" },
            { value: "'Montserrat', sans-serif", label: "Montserrat" },
          ]}
        />
      </Field>
      <Field label="Color">
        <ColorField
          value={(props[k("color")] as string) || "#ffffff"}
          onChange={(v) => onChange({ [k("color")]: v })}
        />
      </Field>
      <Field label="Alineación">
        <div className="flex gap-1">
          {ALIGN_ICONS.map(({ val, Icon }) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ [k("textAlign")]: val })}
              className={`flex-1 py-1.5 rounded-md border transition-colors flex items-center justify-center ${
                ((props[k("textAlign")] as string) || "left") === val
                  ? "border-[var(--color-brand-400)]/50 text-[var(--color-brand-400)] bg-[var(--color-brand-400)]/10"
                  : "border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Interlineado">
          <NumberField
            value={(props[k("lineHeight")] as number) ?? 1.5}
            onChange={(v) => onChange({ [k("lineHeight")]: v })}
            step={0.05} min={0.8}
          />
        </Field>
        <Field label="Kerning">
          <NumberField
            value={(props[k("letterSpacing")] as number) ?? 0}
            onChange={(v) => onChange({ [k("letterSpacing")]: v })}
            step={0.01} unit="em"
          />
        </Field>
      </div>
      <Field label="Transformar">
        <SelectField
          value={(props[k("textTransform")] as string) || "none"}
          onChange={(v) => onChange({ [k("textTransform")]: v })}
          options={[
            { value: "none", label: "Normal" },
            { value: "uppercase", label: "MAYÚSCULAS" },
            { value: "lowercase", label: "minúsculas" },
            { value: "capitalize", label: "Capitalizar" },
          ]}
        />
      </Field>
    </div>
  );
}

// ── Array editor ───────────────────────────────────────────────────────────
export function ArrayEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  defaultItem,
  renderItem,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  defaultItem: T;
  renderItem: (item: T, idx: number, update: (partial: Partial<T>) => void, remove: () => void) => React.ReactNode;
  addLabel?: string;
}) {
  function update(idx: number, partial: Partial<T>) {
    const next = items.map((item, i) => (i === idx ? { ...item, ...partial } : item));
    onChange(next);
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...items, { ...defaultItem }]);
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {renderItem(item, idx, (partial) => update(idx, partial), () => remove(idx))}
        </React.Fragment>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-xs hover:border-white/40 hover:text-white/70 transition-colors"
      >
        + {addLabel ?? "Añadir"}
      </button>
    </div>
  );
}
