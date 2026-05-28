import { BlockShell, Field, TextField, ColorField, SelectField, SectionTitle, BgSettings, SpacingSettings } from "../shared";

export const projectsDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  eyebrow: "Nuestro trabajo",
  title: "Proyectos destacados",
  subtitle: "Una muestra de lo que podemos hacer por tu empresa.",
  columns: "3",
  accentColor: "#ffae00",
  textColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.6)",
  viewAllLabel: "Ver todos los proyectos",
  viewAllUrl: "/es/proyectos",
};

interface Project {
  id: string;
  titleEs: string;
  titleEn?: string | null;
  descEs?: string | null;
  descEn?: string | null;
  cover?: string | null;
  category?: string | null;
}

export function ProjectsBlock(props: Record<string, any>) {
  const projects = (props.projects as Project[]) || [];
  const cols = (props.columns as string) || "3";
  const gridCls: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  const accent = (props.accentColor as string) || "#ffae00";

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
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black mb-3" style={{ color: (props.textColor as string) || "#ffffff" }}>
            {props.title as string}
          </h2>
        )}
        {props.subtitle && (
          <p data-sel-prop="subtitle" className="text-base max-w-xl mx-auto" style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.6)" }}>
            {props.subtitle as string}
          </p>
        )}
      </div>

      {projects.length > 0 ? (
        <div className={`grid ${gridCls[cols] ?? "grid-cols-3"} gap-6`}>
          {projects.map((proj) => (
            <div key={proj.id} className="rounded-2xl overflow-hidden group cursor-pointer">
              <div className="relative aspect-[4/3] bg-white/5">
                {proj.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proj.cover} alt={proj.titleEs} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">Sin imagen</div>
                )}
                {proj.category && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: `${accent}cc`, color: "#0a1422" }}>
                    {proj.category}
                  </span>
                )}
              </div>
              <div className="p-4 bg-white/4 border-t border-white/8">
                <h3 className="font-bold text-sm" style={{ color: (props.textColor as string) || "#ffffff" }}>{proj.titleEs}</h3>
                {proj.descEs && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.6)" }}>
                    {proj.descEs}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/15 text-white/40">
          Proyectos se cargan desde la base de datos
        </div>
      )}

      {props.viewAllLabel && (
        <div className="text-center mt-10">
          <a href={(props.viewAllUrl as string) || "#"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border"
            style={{ borderColor: `${accent}40`, color: accent }}>
            {props.viewAllLabel as string} →
          </a>
        </div>
      )}
    </BlockShell>
  );
}

export function ProjectsSettings({
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
      <SectionTitle>Botón "ver todos"</SectionTitle>
      <Field label="Texto"><TextField value={(props.viewAllLabel as string) || ""} onChange={(v) => onChange({ viewAllLabel: v })} /></Field>
      <Field label="URL"><TextField value={(props.viewAllUrl as string) || ""} onChange={(v) => onChange({ viewAllUrl: v })} /></Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
