import { BlockShell, Field, TextField, ColorField, SelectField, NumberField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor, ImageField } from "../shared";

interface Testimonial { text: string; name: string; company: string; avatar: string; rating: number }

export const testimonialsDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  eyebrow: "Testimonios",
  title: "Lo que dicen nuestros clientes",
  accentColor: "#ffae00",
  textColor: "#ffffff",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorderColor: "rgba(255,255,255,0.08)",
  columns: "3",
  testimonials: [
    { text: "Excelente trabajo, superaron nuestras expectativas en tiempo y calidad.", name: "María García", company: "Empresa ABC", avatar: "", rating: 5 },
    { text: "Los mejores en rotulación vehicular de Puerto Rico. Muy profesionales.", name: "Juan Rodríguez", company: "Distribuidora XYZ", avatar: "", rating: 5 },
    { text: "Rápidos, eficientes y el resultado final fue impresionante.", name: "Ana Martínez", company: "Grupo 123", avatar: "", rating: 5 },
  ] as Testimonial[],
};

export function TestimonialsBlock(props: Record<string, unknown>) {
  const testimonials = (props.testimonials as Testimonial[]) || [];
  const cols = (props.columns as string) || "3";
  const accent = (props.accentColor as string) || "#ffae00";
  const gridCls: Record<string, string> = {
    "1": "grid-cols-1", "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <BlockShell props={props}>
      <div className="text-center mb-12">
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

      <div className={`grid ${gridCls[cols] ?? "grid-cols-3"} gap-6`}>
        {testimonials.map((t, i) => (
          <div key={i} className="rounded-2xl p-6 flex flex-col gap-4 border"
            style={{ background: (props.cardBg as string) || "rgba(255,255,255,0.04)", borderColor: (props.cardBorderColor as string) || "rgba(255,255,255,0.08)" }}>
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: t.rating || 5 }).map((_, j) => (
                <span key={j} style={{ color: accent }}>★</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed italic" style={{ color: "rgba(255,255,255,0.8)" }}>
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/8">
              {t.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `${accent}30`, color: accent }}>
                  {t.name[0]}
                </div>
              )}
              <div>
                <div className="text-sm font-bold" style={{ color: (props.textColor as string) || "#ffffff" }}>{t.name}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{t.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

export function TestimonialsSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  const testimonials = (props.testimonials as Testimonial[]) || [];
  return (
    <div className="space-y-3">
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} /></Field>
      <Field label="Columnas">
        <SelectField value={(props.columns as string) || "3"} onChange={(v) => onChange({ columns: v })}
          options={["1","2","3"].map((n) => ({ value: n, label: n }))} />
      </Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>
      <Field label="Color texto"><ColorField value={(props.textColor as string) || "#ffffff"} onChange={(v) => onChange({ textColor: v })} /></Field>

      <SectionTitle>Testimonios</SectionTitle>
      <ArrayEditor
        items={testimonials}
        onChange={(items) => onChange({ testimonials: items })}
        defaultItem={{ text: "", name: "", company: "", avatar: "", rating: 5 }}
        addLabel="Añadir testimonio"
        renderItem={(item, _idx, update, remove) => (
          <div className="p-3 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <Field label="Texto"><TextField value={item.text} onChange={(v) => update({ text: v })} multiline /></Field>
            <Field label="Nombre"><TextField value={item.name} onChange={(v) => update({ name: v })} /></Field>
            <Field label="Empresa"><TextField value={item.company} onChange={(v) => update({ company: v })} /></Field>
            <ImageField label="Avatar" value={item.avatar} onChange={(v) => update({ avatar: v })} />
            <Field label="Estrellas"><NumberField value={item.rating} onChange={(v) => update({ rating: v })} min={1} max={5} /></Field>
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
