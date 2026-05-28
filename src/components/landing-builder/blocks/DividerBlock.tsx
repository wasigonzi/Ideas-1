import { Field, ColorField, NumberField, SelectField, TextField, SectionTitle } from "../shared";

export const dividerDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 24,
  padBottom: 24,
  maxWidth: "full",
  color: "rgba(255,255,255,0.15)",
  thickness: 1,
  style: "solid",
  width: "100%",
  label: "",
  labelColor: "rgba(255,255,255,0.4)",
};

export function DividerBlock(props: Record<string, any>) {
  const color = (props.color as string) || "rgba(255,255,255,0.15)";
  const thickness = (props.thickness as number) || 1;
  const lineStyle = (props.style as string) || "solid";
  const width = (props.width as string) || "100%";
  const label = props.label as string | undefined;

  return (
    <div style={{ paddingTop: (props.padTop as number) ?? 24, paddingBottom: (props.padBottom as number) ?? 24 }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        {label ? (
          <div className="flex items-center gap-4">
            <div className="flex-1" style={{ height: thickness, borderTop: `${thickness}px ${lineStyle} ${color}`, width: "100%" }} />
            <span className="text-xs font-semibold shrink-0 px-3" style={{ color: (props.labelColor as string) || "rgba(255,255,255,0.4)" }}>
              {label}
            </span>
            <div className="flex-1" style={{ height: thickness, borderTop: `${thickness}px ${lineStyle} ${color}`, width: "100%" }} />
          </div>
        ) : (
          <div style={{ borderTop: `${thickness}px ${lineStyle} ${color}`, width, margin: "0 auto" }} />
        )}
      </div>
    </div>
  );
}

export function DividerSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Color"><ColorField value={(props.color as string) || "rgba(255,255,255,0.15)"} onChange={(v) => onChange({ color: v })} /></Field>
      <Field label="Grosor"><NumberField value={(props.thickness as number) || 1} onChange={(v) => onChange({ thickness: v })} unit="px" min={1} max={10} /></Field>
      <Field label="Estilo">
        <SelectField value={(props.style as string) || "solid"} onChange={(v) => onChange({ style: v })}
          options={[{ value: "solid", label: "Sólido" }, { value: "dashed", label: "Guiones" }, { value: "dotted", label: "Puntos" }]} />
      </Field>
      <Field label="Ancho">
        <SelectField value={(props.width as string) || "100%"} onChange={(v) => onChange({ width: v })}
          options={[{ value: "100%", label: "100%" }, { value: "75%", label: "75%" }, { value: "50%", label: "50%" }, { value: "25%", label: "25%" }]} />
      </Field>
      <Field label="Etiqueta (opcional)"><TextField value={(props.label as string) || ""} onChange={(v) => onChange({ label: v })} placeholder="o" /></Field>
      {Boolean(props.label) && (
        <Field label="Color etiqueta"><ColorField value={(props.labelColor as string) || "rgba(255,255,255,0.4)"} onChange={(v) => onChange({ labelColor: v })} /></Field>
      )}
      <SectionTitle>Espaciado</SectionTitle>
      <Field label="Padding arriba"><NumberField value={(props.padTop as number) ?? 24} onChange={(v) => onChange({ padTop: v })} unit="px" /></Field>
      <Field label="Padding abajo"><NumberField value={(props.padBottom as number) ?? 24} onChange={(v) => onChange({ padBottom: v })} unit="px" /></Field>
    </div>
  );
}
