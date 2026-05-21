import { BlockShell, Field, TextField, ColorField, SelectField, NumberField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor } from "../shared";

interface StatItem { value: string; label: string }

export const statsDefaults: Record<string, unknown> = {
  bgType: "color",
  bgColor: "#0e1a2c",
  padTop: 40,
  padBottom: 40,
  maxWidth: "1200px",
  stats: [
    { value: "500+", label: "Proyectos completados" },
    { value: "200+", label: "Clientes satisfechos" },
    { value: "20,000+", label: "sq ft de producción" },
    { value: "20+", label: "Años de experiencia" },
  ] as StatItem[],
  columns: "4",
  valueColor: "#ffae00",
  labelColor: "rgba(255,255,255,0.6)",
  valueFontSize: "4xl",
  dividers: true,
};

export function StatsBlock(props: Record<string, unknown>) {
  const stats = (props.stats as StatItem[]) || [];
  const cols = props.columns as string || "4";
  const gridCls: Record<string, string> = {
    "2": "grid-cols-2", "3": "grid-cols-3", "4": "grid-cols-2 sm:grid-cols-4",
    "5": "grid-cols-3 sm:grid-cols-5",
  };
  const sizeCls: Record<string, string> = {
    "2xl": "text-2xl", "3xl": "text-3xl", "4xl": "text-4xl", "5xl": "text-5xl",
  };

  return (
    <BlockShell props={props}>
      <div className={`grid ${gridCls[cols] ?? "grid-cols-4"} gap-4`}>
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center text-center py-4 ${
              props.dividers && i < stats.length - 1 ? "sm:border-r border-white/10" : ""
            }`}
          >
            <span
              className={`font-black leading-none ${sizeCls[(props.valueFontSize as string)] ?? "text-4xl"}`}
              style={{ color: (props.valueColor as string) || "#ffae00" }}
            >
              {s.value}
            </span>
            <span
              className="text-sm mt-1.5"
              style={{ color: (props.labelColor as string) || "rgba(255,255,255,0.6)" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

export function StatsSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  const stats = (props.stats as StatItem[]) || [];
  return (
    <div className="space-y-3">
      <Field label="Columnas">
        <SelectField
          value={(props.columns as string) || "4"}
          onChange={(v) => onChange({ columns: v })}
          options={["2","3","4","5"].map((n) => ({ value: n, label: n }))}
        />
      </Field>
      <Field label="Color valores"><ColorField value={(props.valueColor as string) || "#ffae00"} onChange={(v) => onChange({ valueColor: v })} /></Field>
      <Field label="Color etiquetas"><ColorField value={(props.labelColor as string) || "rgba(255,255,255,0.6)"} onChange={(v) => onChange({ labelColor: v })} /></Field>
      <Field label="Tamaño número">
        <SelectField
          value={(props.valueFontSize as string) || "4xl"}
          onChange={(v) => onChange({ valueFontSize: v })}
          options={["2xl","3xl","4xl","5xl"].map((s) => ({ value: s, label: s }))}
        />
      </Field>
      <Field label="Divisores" horizontal>
        <input type="checkbox" checked={!!(props.dividers)} onChange={(e) => onChange({ dividers: e.target.checked })} className="w-4 h-4 accent-[var(--color-brand-500)]" />
      </Field>

      <SectionTitle>Estadísticas</SectionTitle>
      <ArrayEditor
        items={stats}
        onChange={(items) => onChange({ stats: items })}
        defaultItem={{ value: "0", label: "Etiqueta" }}
        addLabel="Añadir estadística"
        renderItem={(item, _idx, update, remove) => (
          <div className="p-2 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <Field label="Valor">
              <TextField value={item.value} onChange={(v) => update({ value: v })} placeholder="500+" />
            </Field>
            <Field label="Etiqueta">
              <TextField value={item.label} onChange={(v) => update({ label: v })} placeholder="Proyectos" />
            </Field>
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
