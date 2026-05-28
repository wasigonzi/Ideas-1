import { BlockShell, Field, TextField, ColorField, SelectField, ToggleField, SectionTitle, BgSettings, SpacingSettings } from "../shared";

interface Employee { id: string; name: string; role?: string; avatarUrl?: string | null }

export const teamDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  eyebrow: "Nuestro equipo",
  title: "Las personas detrás de IDEAS",
  subtitle: "Un equipo apasionado y comprometido con la calidad.",
  titleColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.6)",
  accentColor: "#ffae00",
  columns: "4",
  showRole: true,
  showAvatar: true,
};

export function TeamBlock(props: Record<string, any>) {
  const employees = (props.employees as Employee[]) || [];
  const accent = (props.accentColor as string) || "#ffae00";
  const cols = (props.columns as string) || "4";
  const gridCls: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-2 lg:grid-cols-4",
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
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black mb-3"
            style={{ color: (props.titleColor as string) || "#ffffff" }}>
            {props.title as string}
          </h2>
        )}
        {props.subtitle && (
          <p data-sel-prop="subtitle" className="text-base max-w-xl mx-auto"
            style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.6)" }}>
            {props.subtitle as string}
          </p>
        )}
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
          Los empleados se cargan automáticamente desde la base de datos
        </div>
      ) : (
        <div className={`grid ${gridCls[cols] ?? "grid-cols-4"} gap-6`}>
          {employees.map((emp) => (
            <div key={emp.id} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/8 text-center">
              {props.showAvatar && (
                emp.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={emp.avatarUrl} alt={emp.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black"
                    style={{ background: `${accent}30`, color: accent }}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                )
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: (props.titleColor as string) || "#ffffff" }}>{emp.name}</p>
                {props.showRole && emp.role && (
                  <p className="text-xs mt-0.5" style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.5)" }}>{emp.role}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

export function TeamSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) || ""} onChange={(v) => onChange({ eyebrow: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} multiline /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} multiline /></Field>
      <Field label="Columnas">
        <SelectField value={(props.columns as string) || "4"} onChange={(v) => onChange({ columns: v })}
          options={["2","3","4"].map((n) => ({ value: n, label: n }))} />
      </Field>
      <Field label="Mostrar avatar" horizontal>
        <ToggleField value={!!(props.showAvatar)} onChange={(v) => onChange({ showAvatar: v })} />
      </Field>
      <Field label="Mostrar rol" horizontal>
        <ToggleField value={!!(props.showRole)} onChange={(v) => onChange({ showRole: v })} />
      </Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
