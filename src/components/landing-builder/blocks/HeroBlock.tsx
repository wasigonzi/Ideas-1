import { BlockShell, Field, TextField, ColorField, ToggleField, SelectField, ImageField, NumberField, UrlField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor } from "../shared";

// ── Defaults ──────────────────────────────────────────────────────────────
export const heroDefaults: Record<string, unknown> = {
  bgType: "image",
  bgImage: "https://static.showit.co/1200/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png",
  bgOverlay: true,
  bgOverlayColor: "#000000",
  bgOverlayOpacity: 55,
  padTop: 120,
  padBottom: 120,
  maxWidth: "1200px",
  eyebrow: "",
  eyebrowColor: "#ffae00",
  title: "Transformamos tus ideas en impresión y rotulación.",
  titleSize: "5xl",
  titleColor: "#ffffff",
  subtitle: "Ideas, LLC – Más de 20 años creando la identidad visual de Puerto Rico.",
  subtitleColor: "rgba(255,255,255,0.75)",
  alignment: "left",
  ctaPrimaryText: "Ver servicios",
  ctaPrimaryUrl: "/es/servicios",
  ctaPrimaryBg: "#ffae00",
  ctaPrimaryColor: "#0a1422",
  ctaSecondaryText: "Cotizar ahora",
  ctaSecondaryUrl: "/es/cotizacion",
  showCard: true,
  cardImage: "https://static.showit.co/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg",
  cardBadge: "Proyecto destacado",
  cardTitle: "Manufactura de letras 3D",
  showStats: true,
  stat1Value: "500+",
  stat1Label: "Proyectos",
  stat2Value: "200+",
  stat2Label: "Clientes",
  stat3Value: "20+",
  stat3Label: "Años",
};

// ── Block ──────────────────────────────────────────────────────────────────
export function HeroBlock(props: Record<string, unknown>) {
  const alignment = (props.alignment as string) || "left";
  const titleSize = (props.titleSize as string) || "5xl";
  const accentColor = (props.ctaPrimaryBg as string) || "#ffae00";

  const titleCls: Record<string, string> = {
    "3xl": "text-2xl sm:text-3xl",
    "4xl": "text-3xl sm:text-4xl",
    "5xl": "text-3xl sm:text-5xl",
    "6xl": "text-4xl sm:text-6xl",
    "7xl": "text-4xl sm:text-7xl",
    "8xl": "text-5xl sm:text-8xl",
  };

  return (
    <BlockShell props={props}>
      <div
        className={`flex gap-8 lg:gap-12 ${
          alignment === "center"
            ? "flex-col items-center text-center"
            : "flex-col lg:flex-row items-start lg:items-center"
        }`}
      >
        {/* Text side */}
        <div className="flex-1 min-w-0">
          {props.eyebrow && (
            <div
              data-sel-prop="eyebrow"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-xs font-bold uppercase tracking-widest"
              style={{ background: `${accentColor}22`, color: (props.eyebrowColor as string) || accentColor }}
            >
              {props.eyebrow as string}
            </div>
          )}
          <h1
            data-sel-prop="title"
            className={`font-black leading-tight mb-5 ${titleCls[titleSize] ?? "text-5xl"}`}
            style={{ color: (props.titleColor as string) || "#ffffff" }}
          >
            {(props.title as string) || "Título de la sección"}
          </h1>
          {props.subtitle && (
            <p
              data-sel-prop="subtitle"
              className="text-base sm:text-lg mb-6 sm:mb-8 max-w-xl leading-relaxed"
              style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.75)" }}
            >
              {props.subtitle as string}
            </p>
          )}
          {/* CTAs */}
          <div className={`flex gap-3 flex-wrap ${alignment === "center" ? "justify-center" : "justify-start"}`}>
            {props.ctaPrimaryText && (
              <a
                data-sel-prop="ctaPrimaryText"
                href={(props.ctaPrimaryUrl as string) || "#"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                style={{
                  background: accentColor,
                  color: (props.ctaPrimaryColor as string) || "#0a1422",
                }}
              >
                {props.ctaPrimaryText as string}
              </a>
            )}
            {props.ctaSecondaryText && (
              <a
                data-sel-prop="ctaSecondaryText"
                href={(props.ctaSecondaryUrl as string) || "#"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/25 text-white hover:bg-white/10 transition-colors"
              >
                {props.ctaSecondaryText as string}
              </a>
            )}
          </div>
          {/* Stats */}
          {props.showStats && (
            <div className="flex flex-wrap gap-6 sm:gap-8 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/15">
              {(["1", "2", "3"] as const).map((n) =>
                props[`stat${n}Value`] ? (
                  <div key={n}>
                    <div className="text-2xl font-black" style={{ color: accentColor, fontSize: "50px" }}>
                      {props[`stat${n}Value`] as string}
                    </div>
                    <div className="text-xs text-white/55 mt-0.5">
                      {props[`stat${n}Label`] as string}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Card image */}
        {props.showCard && props.cardImage && alignment !== "center" && (
          <div className="hidden lg:block w-72 shrink-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={props.cardImage as string}
                alt={(props.cardTitle as string) || ""}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
                {props.cardBadge && (
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: accentColor }}
                  >
                    {props.cardBadge as string}
                  </div>
                )}
                {props.cardTitle && (
                  <div className="text-sm font-bold text-white">{props.cardTitle as string}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </BlockShell>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────
export function HeroSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Eyebrow">
        <TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} placeholder="Texto pequeño arriba" />
      </Field>
      <Field label="Color eyebrow">
        <ColorField value={(props.eyebrowColor as string) || "#ffae00"} onChange={(v) => onChange({ eyebrowColor: v })} />
      </Field>
      <Field label="Título principal">
        <TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} multiline />
      </Field>
      <Field label="Tamaño título">
        <SelectField
          value={(props.titleSize as string) || "5xl"}
          onChange={(v) => onChange({ titleSize: v })}
          options={["3xl","4xl","5xl","6xl","7xl","8xl"].map((s) => ({ value: s, label: s }))}
        />
      </Field>
      <Field label="Color título">
        <ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} />
      </Field>
      <Field label="Subtítulo">
        <TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} multiline />
      </Field>
      <Field label="Color subtítulo">
        <ColorField value={(props.subtitleColor as string) || "rgba(255,255,255,0.75)"} onChange={(v) => onChange({ subtitleColor: v })} />
      </Field>
      <Field label="Alineación">
        <SelectField
          value={(props.alignment as string) || "left"}
          onChange={(v) => onChange({ alignment: v })}
          options={[{ value: "left", label: "Izquierda" }, { value: "center", label: "Centro" }]}
        />
      </Field>

      <SectionTitle>Botón primario</SectionTitle>
      <Field label="Texto"><TextField value={(props.ctaPrimaryText as string) || ""} onChange={(v) => onChange({ ctaPrimaryText: v })} /></Field>
      <Field label="URL"><UrlField value={(props.ctaPrimaryUrl as string) || ""} onChange={(v) => onChange({ ctaPrimaryUrl: v })} /></Field>
      <Field label="Color fondo"><ColorField value={(props.ctaPrimaryBg as string) || "#ffae00"} onChange={(v) => onChange({ ctaPrimaryBg: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.ctaPrimaryColor as string) || "#0a1422"} onChange={(v) => onChange({ ctaPrimaryColor: v })} /></Field>

      <SectionTitle>Botón secundario</SectionTitle>
      <Field label="Texto"><TextField value={(props.ctaSecondaryText as string) || ""} onChange={(v) => onChange({ ctaSecondaryText: v })} /></Field>
      <Field label="URL"><UrlField value={(props.ctaSecondaryUrl as string) || ""} onChange={(v) => onChange({ ctaSecondaryUrl: v })} /></Field>

      <SectionTitle>Tarjeta imagen</SectionTitle>
      <Field label="Mostrar tarjeta" horizontal>
        <ToggleField value={!!(props.showCard)} onChange={(v) => onChange({ showCard: v })} />
      </Field>
      {props.showCard && (
        <>
          <ImageField label="Imagen" value={(props.cardImage as string) || ""} onChange={(v) => onChange({ cardImage: v })} />
          <Field label="Badge"><TextField value={(props.cardBadge as string) || ""} onChange={(v) => onChange({ cardBadge: v })} /></Field>
          <Field label="Título tarjeta"><TextField value={(props.cardTitle as string) || ""} onChange={(v) => onChange({ cardTitle: v })} /></Field>
        </>
      )}

      <SectionTitle>Estadísticas</SectionTitle>
      <Field label="Mostrar stats" horizontal>
        <ToggleField value={!!(props.showStats)} onChange={(v) => onChange({ showStats: v })} />
      </Field>
      {props.showStats && (
        <>
          {(["1", "2", "3"] as const).map((n) => (
            <div key={n} className="grid grid-cols-2 gap-2">
              <Field label={`Stat ${n} valor`}>
                <TextField value={(props[`stat${n}Value`] as string) || ""} onChange={(v) => onChange({ [`stat${n}Value`]: v })} />
              </Field>
              <Field label="Etiqueta">
                <TextField value={(props[`stat${n}Label`] as string) || ""} onChange={(v) => onChange({ [`stat${n}Label`]: v })} />
              </Field>
            </div>
          ))}
        </>
      )}

      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
