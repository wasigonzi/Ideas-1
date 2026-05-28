import { BlockShell, Field, TextField, ColorField, SelectField, ToggleField, SectionTitle, BgSettings, SpacingSettings, ImageField, UrlField } from "../shared";

export const textImageDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  layout: "imageRight",
  image: "https://static.showit.co/800/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png",
  imageRounded: true,
  eyebrow: "Sobre nosotros",
  eyebrowColor: "#ffae00",
  title: "Más de 20 años creando identidad visual en Puerto Rico",
  titleColor: "#ffffff",
  body: "Ideas, LLC es tu aliado de confianza para impresión digital, rotulación vehicular y todo tipo de señalización comercial. Contamos con equipo de última generación y un equipo de diseñadores e impresores especializados.",
  textColor: "rgba(255,255,255,0.75)",
  ctaText: "Conócenos mejor",
  ctaUrl: "/es/nosotros",
  ctaBg: "#ffae00",
  ctaColor: "#0a1422",
  gap: "16",
};

export function TextImageBlock(props: Record<string, any>) {
  const layout = (props.layout as string) || "imageRight";
  const isImageLeft = layout === "imageLeft";
  const accent = (props.ctaBg as string) || "#ffae00";

  const textSide = (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {props.eyebrow && (
        <div data-sel-prop="eyebrow" className="inline-block text-xs font-bold uppercase tracking-[.15em] px-3 py-1 rounded-full w-fit"
          style={{ background: `${accent}20`, color: (props.eyebrowColor as string) || accent }}>
          {props.eyebrow as string}
        </div>
      )}
      {props.title && (
        <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black leading-tight"
          style={{ color: (props.titleColor as string) || "#ffffff" }}>
          {props.title as string}
        </h2>
      )}
      {props.body && (
        <p data-sel-prop="body" className="text-base leading-relaxed" style={{ color: (props.textColor as string) || "rgba(255,255,255,0.75)" }}>
          {props.body as string}
        </p>
      )}
      {props.ctaText && (
        <div>
          <a data-sel-prop="ctaText" href={(props.ctaUrl as string) || "#"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: accent, color: (props.ctaColor as string) || "#0a1422" }}>
            {props.ctaText as string} →
          </a>
        </div>
      )}
    </div>
  );

  const imageSide = (
    <div className="flex-1">
      {props.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.image as string} alt=""
          className={`w-full object-cover shadow-2xl ${props.imageRounded ? "rounded-2xl" : ""}`}
          style={{ maxHeight: "500px" }} />
      ) : (
        <div className="w-full h-64 rounded-2xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center text-white/30 text-sm">
          Sin imagen
        </div>
      )}
    </div>
  );

  return (
    <BlockShell props={props}>
      <div className={`flex flex-col lg:flex-row gap-${(props.gap as string) || "16"} items-center`}>
        {isImageLeft ? (
          <>{imageSide}{textSide}</>
        ) : (
          <>{textSide}{imageSide}</>
        )}
      </div>
    </BlockShell>
  );
}

export function TextImageSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Layout">
        <SelectField value={(props.layout as string) || "imageRight"} onChange={(v) => onChange({ layout: v })}
          options={[{ value: "imageRight", label: "Texto izq / Imagen der" }, { value: "imageLeft", label: "Imagen izq / Texto der" }]} />
      </Field>
      <ImageField label="Imagen" value={(props.image as string) || ""} onChange={(v) => onChange({ image: v })} />
      <Field label="Bordes redondeados" horizontal>
        <ToggleField value={!!(props.imageRounded)} onChange={(v) => onChange({ imageRounded: v })} />
      </Field>
      <Field label="Separación">
        <SelectField value={(props.gap as string) || "16"} onChange={(v) => onChange({ gap: v })}
          options={["8","12","16","20","24"].map((n) => ({ value: n, label: `${n} × 4px` }))} />
      </Field>
      <SectionTitle>Texto</SectionTitle>
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} /></Field>
      <Field label="Color eyebrow"><ColorField value={(props.eyebrowColor as string) || "#ffae00"} onChange={(v) => onChange({ eyebrowColor: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} multiline /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Cuerpo"><TextField value={(props.body as string) || ""} onChange={(v) => onChange({ body: v })} multiline rows={4} /></Field>
      <Field label="Color cuerpo"><ColorField value={(props.textColor as string) || "rgba(255,255,255,0.75)"} onChange={(v) => onChange({ textColor: v })} /></Field>
      <SectionTitle>Botón</SectionTitle>
      <Field label="Texto"><TextField value={(props.ctaText as string) || ""} onChange={(v) => onChange({ ctaText: v })} /></Field>
      <Field label="URL"><UrlField value={(props.ctaUrl as string) || ""} onChange={(v) => onChange({ ctaUrl: v })} /></Field>
      <Field label="Color fondo"><ColorField value={(props.ctaBg as string) || "#ffae00"} onChange={(v) => onChange({ ctaBg: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.ctaColor as string) || "#0a1422"} onChange={(v) => onChange({ ctaColor: v })} /></Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
