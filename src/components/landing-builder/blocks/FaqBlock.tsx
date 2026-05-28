"use client";

import { useState } from "react";
import { BlockShell, Field, TextField, ColorField, SelectField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor } from "../shared";

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
  variant: "accordion",
  items: [
    { question: "¿Cuánto tiempo tarda un proyecto?", answer: "Depende del tipo y volumen. Proyectos simples en 3-5 días hábiles. Proyectos grandes pueden tomar 1-2 semanas." },
    { question: "¿Ofrecen diseño gráfico?", answer: "Sí. Nuestro equipo de diseñadores puede crear o adaptar tu arte para producción." },
    { question: "¿Cuál es el área de cobertura?", answer: "Operamos en toda la isla de Puerto Rico con entrega a domicilio o recogido en nuestro local." },
  ] as FaqItem[],
};

// ── Card grid variant ─────────────────────────────────────────────────────
function CardsVariant({ items, accent, textColor, subtitleColor }: {
  items: FaqItem[];
  accent: string;
  textColor: string;
  subtitleColor: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => {
        const isActive = active === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setActive(isActive ? null : i)}
            className="text-left p-6 rounded-2xl border transition-all duration-300 focus:outline-none group"
            style={{
              background: isActive ? `${accent}14` : "rgba(255,255,255,0.03)",
              borderColor: isActive ? accent : "rgba(255,255,255,0.1)",
              boxShadow: isActive ? `0 8px 32px -8px ${accent}40` : undefined,
              transform: isActive ? "translateY(-4px)" : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.borderColor = `${accent}60`;
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }
            }}
          >
            {/* Number badge */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-4 transition-all duration-300"
              style={{
                background: isActive ? accent : `${accent}20`,
                color: isActive ? "#0a1422" : accent,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>

            {/* Title */}
            <h3
              className="font-bold text-base mb-2 transition-colors duration-200"
              style={{ color: isActive ? "#ffffff" : textColor }}
            >
              {item.question}
            </h3>

            {/* Description — always visible, opacity shifts */}
            <p
              className="text-sm leading-relaxed transition-opacity duration-300"
              style={{
                color: subtitleColor,
                opacity: isActive ? 1 : 0.55,
              }}
            >
              {item.answer}
            </p>

            {/* Bottom accent line */}
            <div
              className="mt-4 h-0.5 rounded-full transition-all duration-300"
              style={{
                background: accent,
                opacity: isActive ? 1 : 0,
                width: isActive ? "40px" : "0px",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function FaqBlock(props: Record<string, any>) {
  const items = (props.items as FaqItem[]) || [];
  const accent = (props.accentColor as string) || "#ffae00";
  const textColor = (props.textColor as string) || "#ffffff";
  const subtitleColor = (props.subtitleColor as string) || "rgba(255,255,255,0.6)";
  const variant = (props.variant as string) || "accordion";

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
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black" style={{ color: textColor }}>
            {props.title as string}
          </h2>
        )}
      </div>

      {variant === "cards" ? (
        <CardsVariant items={items} accent={accent} textColor={textColor} subtitleColor={subtitleColor} />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <details key={i} className="group rounded-xl border border-white/10 overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none font-semibold text-sm list-none"
                style={{ color: textColor }}>
                <span>{item.question}</span>
                <span className="shrink-0 text-white/40 group-open:rotate-180 transition-transform duration-200">▾</span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: subtitleColor }}>
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      )}
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
      <Field label="Variante">
        <SelectField
          value={(props.variant as string) || "accordion"}
          onChange={(v) => onChange({ variant: v })}
          options={[
            { value: "accordion", label: "Acordeón" },
            { value: "cards", label: "Tarjetas interactivas" },
          ]}
        />
      </Field>
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
