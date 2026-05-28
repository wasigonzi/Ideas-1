import { BlockShell, Field, TextField, ColorField, SelectField, NumberField, SectionTitle, BgSettings, SpacingSettings, UrlField } from "../shared";

export const bannerDefaults: Record<string, unknown> = {
  bgType: "image",
  bgImage: "https://static.showit.co/1200/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png",
  bgOverlay: true,
  bgOverlayColor: "#000000",
  bgOverlayOpacity: 50,
  padTop: 120,
  padBottom: 60,
  maxWidth: "full",
  minHeight: 400,
  alignment: "center",
  eyebrow: "",
  eyebrowColor: "#ffae00",
  title: "Título del banner",
  subtitle: "Descripción corta del banner",
  titleColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.8)",
  ctaText: "Más información",
  ctaUrl: "#",
  ctaBg: "#ffae00",
  ctaColor: "#0a1422",
};

export function BannerBlock(props: Record<string, any>) {
  const alignment = (props.alignment as string) || "center";
  const accent = (props.ctaBg as string) || "#ffae00";

  return (
    <BlockShell props={props} className="flex items-center">
      <div className={`flex flex-col gap-4 sm:gap-5 ${
        alignment === "center" ? "items-center text-center" : alignment === "right" ? "items-end text-right" : "items-start text-left"
      }`}>
        {props.eyebrow && (
          <p data-sel-prop="eyebrow" className="text-xs font-bold uppercase tracking-widest"
            style={{ color: (props.eyebrowColor as string) || "#ffae00" }}>
            {props.eyebrow as string}
          </p>
        )}
        {props.title && (
          <h2 data-sel-prop="title" className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight max-w-3xl"
            style={{ color: (props.titleColor as string) || "#ffffff" }}>
            {props.title as string}
          </h2>
        )}
        {props.subtitle && (
          <p data-sel-prop="subtitle" className="text-lg max-w-xl leading-relaxed"
            style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.8)" }}>
            {props.subtitle as string}
          </p>
        )}
        {props.ctaText && (
          <a data-sel-prop="ctaText" href={(props.ctaUrl as string) || "#"}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: accent, color: (props.ctaColor as string) || "#0a1422" }}>
            {props.ctaText as string}
          </a>
        )}
      </div>
    </BlockShell>
  );
}

export function BannerSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Altura mínima"><NumberField value={(props.minHeight as number) || 400} onChange={(v) => onChange({ minHeight: v })} unit="px" min={100} /></Field>
      <Field label="Alineación">
        <SelectField value={(props.alignment as string) || "center"} onChange={(v) => onChange({ alignment: v })}
          options={[{ value: "left", label: "Izquierda" }, { value: "center", label: "Centro" }, { value: "right", label: "Derecha" }]} />
      </Field>
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} placeholder="SERVICIOS" /></Field>
      <Field label="Color eyebrow"><ColorField value={(props.eyebrowColor as string) || "#ffae00"} onChange={(v) => onChange({ eyebrowColor: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} multiline /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} multiline /></Field>
      <Field label="Color subtítulo"><ColorField value={(props.subtitleColor as string) || "rgba(255,255,255,0.8)"} onChange={(v) => onChange({ subtitleColor: v })} /></Field>
      <SectionTitle>Botón</SectionTitle>
      <Field label="Texto"><TextField value={(props.ctaText as string) || ""} onChange={(v) => onChange({ ctaText: v })} /></Field>
      <Field label="URL"><UrlField value={(props.ctaUrl as string) || ""} onChange={(v) => onChange({ ctaUrl: v })} /></Field>
      <Field label="Color fondo"><ColorField value={(props.ctaBg as string) || "#ffae00"} onChange={(v) => onChange({ ctaBg: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.ctaColor as string) || "#0a1422"} onChange={(v) => onChange({ ctaColor: v })} /></Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
    </div>
  );
}
