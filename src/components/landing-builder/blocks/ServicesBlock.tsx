import { BlockShell, Field, TextField, ColorField, SelectField, SectionTitle, BgSettings, SpacingSettings } from "../shared";
import { ServicesCardsClient } from "./ServicesCardsClient";
import type { ServiceItem } from "./ServicesCardsClient";

export const servicesDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  eyebrow: "Lo que hacemos",
  title: "Nuestros servicios",
  subtitle: "Impresión de gran formato, rotulación vehicular, letreros y más.",
  columns: "3",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorderColor: "rgba(255,255,255,0.08)",
  textColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.6)",
  accentColor: "#ffae00",
  moreLabel: "Ver todos los servicios",
  moreUrl: "/es/servicios",
};

export function ServicesBlock(props: Record<string, unknown>) {
  const services = (props.services as ServiceItem[]) || [];
  const cols = (props.columns as string) || "3";
  const accent      = (props.accentColor     as string) || "#ffae00";
  const cardBg      = (props.cardBg          as string) || "rgba(255,255,255,0.04)";
  const cardBorder  = (props.cardBorderColor as string) || "rgba(255,255,255,0.08)";
  const textColor   = (props.textColor       as string) || "#ffffff";
  const subtitleClr = (props.subtitleColor   as string) || "rgba(255,255,255,0.6)";

  return (
    <BlockShell props={props}>
      {/* Header */}
      <div className="text-center mb-12">
        {props.eyebrow && (
          <div data-sel-prop="eyebrow" className="inline-block text-xs font-bold uppercase tracking-[.15em] mb-3 px-3 py-1 rounded-full"
            style={{ background: `${accent}20`, color: accent }}>
            {props.eyebrow as string}
          </div>
        )}
        {props.title && (
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black mb-3" style={{ color: textColor }}>
            {props.title as string}
          </h2>
        )}
        {props.subtitle && (
          <p data-sel-prop="subtitle" className="text-base max-w-xl mx-auto" style={{ color: subtitleClr }}>
            {props.subtitle as string}
          </p>
        )}
      </div>

      {services.length > 0 ? (
        <ServicesCardsClient
          services={services}
          cols={cols}
          cardBg={cardBg}
          cardBorderColor={cardBorder}
          textColor={textColor}
          subtitleColor={subtitleClr}
          accent={accent}
        />
      ) : (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/15 text-white/40">
          Servicios se cargan desde la base de datos
        </div>
      )}

      {props.moreLabel && (
        <div className="text-center mt-10">
          <a data-sel-prop="moreLabel" href={(props.moreUrl as string) || "#"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border"
            style={{ borderColor: `${accent}40`, color: accent }}>
            {props.moreLabel as string} →
          </a>
        </div>
      )}
    </BlockShell>
  );
}

export function ServicesSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} multiline /></Field>
      <Field label="Columnas">
        <SelectField value={(props.columns as string) || "3"} onChange={(v) => onChange({ columns: v })}
          options={["2","3","4"].map((n) => ({ value: n, label: n }))} />
      </Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.textColor as string) || "#ffffff"} onChange={(v) => onChange({ textColor: v })} /></Field>
      <Field label="Color subtítulo"><ColorField value={(props.subtitleColor as string) || "rgba(255,255,255,0.6)"} onChange={(v) => onChange({ subtitleColor: v })} /></Field>
      <Field label="Color fondo tarjeta"><ColorField value={(props.cardBg as string) || "rgba(255,255,255,0.04)"} onChange={(v) => onChange({ cardBg: v })} /></Field>
      <SectionTitle>Botón "ver todos"</SectionTitle>
      <Field label="Texto"><TextField value={(props.moreLabel as string) || ""} onChange={(v) => onChange({ moreLabel: v })} /></Field>
      <Field label="URL"><TextField value={(props.moreUrl as string) || ""} onChange={(v) => onChange({ moreUrl: v })} /></Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
