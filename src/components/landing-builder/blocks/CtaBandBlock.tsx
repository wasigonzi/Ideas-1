import { BlockShell, Field, TextField, ColorField, SelectField, SectionTitle, BgSettings, SpacingSettings, UrlField } from "../shared";

export const ctaBandDefaults: Record<string, unknown> = {
  bgType: "gradient",
  bgGradFrom: "#ffae00",
  bgGradTo: "#f59e0b",
  bgGradAngle: 135,
  padTop: 72,
  padBottom: 72,
  maxWidth: "960px",
  title: "¿Listo para empezar tu próximo proyecto?",
  subtitle: "Solicita una cotización gratuita. Respondemos en menos de 24 horas.",
  textColor: "#0a1422",
  subtitleColor: "rgba(10,20,34,0.75)",
  alignment: "center",
  btnText: "Cotizar ahora",
  btnUrl: "/cotizacion",
  btnBg: "#0a1422",
  btnColor: "#ffffff",
  btn2Text: "Ver servicios",
  btn2Url: "/servicios",
};

export function CtaBandBlock(props: Record<string, any>) {
  const alignment = (props.alignment as string) || "center";

  return (
    <BlockShell props={props}>
      <div className={`flex flex-col ${alignment === "center" ? "items-center text-center" : "items-start"} gap-6`}>
        {props.title && (
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black leading-tight max-w-2xl"
            style={{ color: (props.textColor as string) || "#0a1422" }}>
            {props.title as string}
          </h2>
        )}
        {props.subtitle && (
          <p data-sel-prop="subtitle" className="text-base max-w-xl leading-relaxed"
            style={{ color: (props.subtitleColor as string) || "rgba(10,20,34,0.75)" }}>
            {props.subtitle as string}
          </p>
        )}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {props.btnText && (
            <a data-sel-prop="btnText" href={(props.btnUrl as string) || "#"}
              className="inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: (props.btnBg as string) || "#0a1422", color: (props.btnColor as string) || "#ffffff" }}>
              {props.btnText as string}
            </a>
          )}
          {props.btn2Text && (
            <a data-sel-prop="btn2Text" href={(props.btn2Url as string) || "#"}
              className="inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border-2 hover:bg-black/10 transition-colors"
              style={{ borderColor: (props.btnBg as string) || "#0a1422", color: (props.textColor as string) || "#0a1422" }}>
              {props.btn2Text as string}
            </a>
          )}
        </div>
      </div>
    </BlockShell>
  );
}

export function CtaBandSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} multiline /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} multiline /></Field>
      <Field label="Color texto"><ColorField value={(props.textColor as string) || "#0a1422"} onChange={(v) => onChange({ textColor: v })} /></Field>
      <Field label="Color subtítulo"><ColorField value={(props.subtitleColor as string) || "rgba(10,20,34,0.75)"} onChange={(v) => onChange({ subtitleColor: v })} /></Field>
      <Field label="Alineación">
        <SelectField value={(props.alignment as string) || "center"} onChange={(v) => onChange({ alignment: v })}
          options={[{ value: "center", label: "Centro" }, { value: "left", label: "Izquierda" }]} />
      </Field>
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
      <SectionTitle>Botón principal</SectionTitle>
      <Field label="Texto"><TextField value={(props.btnText as string) || ""} onChange={(v) => onChange({ btnText: v })} /></Field>
      <Field label="URL"><UrlField value={(props.btnUrl as string) || ""} onChange={(v) => onChange({ btnUrl: v })} /></Field>
      <Field label="Color fondo"><ColorField value={(props.btnBg as string) || "#0a1422"} onChange={(v) => onChange({ btnBg: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.btnColor as string) || "#ffffff"} onChange={(v) => onChange({ btnColor: v })} /></Field>
      <SectionTitle>Botón secundario</SectionTitle>
      <Field label="Texto"><TextField value={(props.btn2Text as string) || ""} onChange={(v) => onChange({ btn2Text: v })} /></Field>
      <Field label="URL"><UrlField value={(props.btn2Url as string) || ""} onChange={(v) => onChange({ btn2Url: v })} /></Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
    </div>
  );
}
