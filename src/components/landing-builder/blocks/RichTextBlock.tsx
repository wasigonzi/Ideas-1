import { BlockShell, Field, ColorField, SelectField, SectionTitle, BgSettings, SpacingSettings } from "../shared";
import DOMPurify from "isomorphic-dompurify";

export const richTextDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 48,
  padBottom: 48,
  maxWidth: "800px",
  html: "<h2>Título de sección</h2><p>Este es un bloque de texto enriquecido. Puedes pegar HTML aquí para mostrar contenido personalizado con formato completo.</p>",
  textColor: "#ffffff",
  textAlign: "left",
  fontSize: "base",
  linkColor: "#ffae00",
};

export function RichTextBlock(props: Record<string, unknown>) {
  const sizeCls: Record<string, string> = {
    sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl",
  };

  return (
    <BlockShell props={props}>
      <div
        data-sel-prop="html"
        className={`prose prose-invert max-w-none ${sizeCls[(props.fontSize as string)] ?? "text-base"}`}
        style={{
          color: (props.textColor as string) || "#ffffff",
          textAlign: (props.textAlign as "left" | "center" | "right" | "justify") || "left",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["--tw-prose-links" as any]: (props.linkColor as string) || "#ffae00",
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((props.html as string) || "") }}
      />
    </BlockShell>
  );
}

export function RichTextSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="HTML">
        <textarea
          value={(props.html as string) || ""}
          onChange={(e) => onChange({ html: e.target.value })}
          rows={8}
          className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)] resize-y"
          placeholder="<h2>Título</h2><p>Contenido...</p>"
        />
      </Field>
      <Field label="Color texto"><ColorField value={(props.textColor as string) || "#ffffff"} onChange={(v) => onChange({ textColor: v })} /></Field>
      <Field label="Color links"><ColorField value={(props.linkColor as string) || "#ffae00"} onChange={(v) => onChange({ linkColor: v })} /></Field>
      <Field label="Alineación">
        <SelectField value={(props.textAlign as string) || "left"} onChange={(v) => onChange({ textAlign: v })}
          options={[{ value: "left", label: "Izquierda" }, { value: "center", label: "Centro" }, { value: "right", label: "Derecha" }, { value: "justify", label: "Justificado" }]} />
      </Field>
      <Field label="Tamaño fuente">
        <SelectField value={(props.fontSize as string) || "base"} onChange={(v) => onChange({ fontSize: v })}
          options={[{ value: "sm", label: "Pequeño" }, { value: "base", label: "Normal" }, { value: "lg", label: "Grande" }, { value: "xl", label: "Extra grande" }]} />
      </Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
