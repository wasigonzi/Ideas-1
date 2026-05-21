import { BlockShell, Field, TextField, ColorField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor } from "../shared";

interface FaqItem { question: string; answer: string }

export const faqDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "800px",
  eyebrow: "FAQ",
  title: "Preguntas frecuentes",
  accentColor: "#ffae00",
  textColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.6)",
  items: [
    { question: "¿Cuánto tiempo tarda un proyecto?", answer: "Depende del tipo y volumen. Proyectos simples en 3-5 días hábiles. Proyectos grandes pueden tomar 1-2 semanas." },
    { question: "¿Ofrecen diseño gráfico?", answer: "Sí. Nuestro equipo de diseñadores puede crear o adaptar tu arte para producción." },
    { question: "¿Cuál es el área de cobertura?", answer: "Operamos en toda la isla de Puerto Rico con entrega a domicilio o recogido en nuestro local." },
  ] as FaqItem[],
};

export function FaqBlock(props: Record<string, unknown>) {
  const items = (props.items as FaqItem[]) || [];
  const accent = (props.accentColor as string) || "#ffae00";

  return (
    <BlockShell props={props}>
      <div className="text-center mb-10">
        {props.eyebrow && (
          <div data-sel-prop="eyebrow" className="inline-block text-xs font-bold uppercase tracking-[.15em] mb-3 px-3 py-1 rounded-full"
            style={{ background: `${accent}20`, color: accent }}>
            {props.eyebrow as string}
          </div>
        )}
        {props.title && (
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black" style={{ color: (props.textColor as string) || "#ffffff" }}>
            {props.title as string}
          </h2>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <details key={i} className="group rounded-xl border border-white/10 overflow-hidden">
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none font-semibold text-sm list-none"
              style={{ color: (props.textColor as string) || "#ffffff" }}>
              <span>{item.question}</span>
              <span className="shrink-0 text-white/40 group-open:rotate-180 transition-transform duration-200">▾</span>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed"
              style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.6)" }}>
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </BlockShell>
  );
}

export function FaqSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  const items = (props.items as FaqItem[]) || [];
  return (
    <div className="space-y-3">
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} /></Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.textColor as string) || "#ffffff"} onChange={(v) => onChange({ textColor: v })} /></Field>

      <SectionTitle>Preguntas</SectionTitle>
      <ArrayEditor
        items={items}
        onChange={(items) => onChange({ items })}
        defaultItem={{ question: "Pregunta", answer: "Respuesta" }}
        addLabel="Añadir pregunta"
        renderItem={(item, _idx, update, remove) => (
          <div className="p-3 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <Field label="Pregunta"><TextField value={item.question} onChange={(v) => update({ question: v })} /></Field>
            <Field label="Respuesta"><TextField value={item.answer} onChange={(v) => update({ answer: v })} multiline rows={3} /></Field>
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
