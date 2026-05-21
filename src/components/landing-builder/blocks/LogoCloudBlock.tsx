import { BlockShell, Field, TextField, ColorField, ToggleField, SectionTitle, BgSettings, SpacingSettings, ImageField, ArrayEditor } from "../shared";

interface LogoItem { src: string; alt: string }

const DEFAULT_LOGOS: LogoItem[] = [
  { src: "https://static.showit.co/200/huOjXPKjQzRd-m18fvGrnA/shared/logo_conwaste_new.png", alt: "Conwaste" },
  { src: "https://static.showit.co/200/pJz68KELZc4_l3bBO4XFIA/shared/centromedico-.png", alt: "Centro Médico" },
  { src: "https://static.showit.co/200/qi0SH5aHraOZ8dgdbAbAEQ/shared/triple-s-logo-vector.png", alt: "Triple-S" },
  { src: "https://static.showit.co/200/8Jp1ZKYC17-OBo8ohlu-NA/shared/wipr-logo.png", alt: "WIPR" },
];

export const logoCloudDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 48,
  padBottom: 48,
  maxWidth: "1200px",
  title: "Empresas que confían en nosotros",
  titleColor: "rgba(255,255,255,0.5)",
  logos: DEFAULT_LOGOS,
  grayscale: true,
  marquee: true,
};

export function LogoCloudBlock(props: Record<string, unknown>) {
  const logos = (props.logos as LogoItem[]) || [];

  return (
    <BlockShell props={props}>
      {props.title && (
        <p
          data-sel-prop="title"
          className="text-center text-xs font-semibold uppercase tracking-[.15em] mb-8"
          style={{ color: (props.titleColor as string) || "rgba(255,255,255,0.5)" }}
        >
          {props.title as string}
        </p>
      )}
      {props.marquee ? (
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
          <div className="flex gap-10 items-center animate-[marquee_30s_linear_infinite] w-max">
            {[...logos, ...logos].map((logo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={logo.src}
                alt={logo.alt}
                className={`h-8 object-contain ${props.grayscale ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : ""} transition-all`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center items-center gap-8">
          {logos.map((logo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={logo.src}
              alt={logo.alt}
              className={`h-8 object-contain ${props.grayscale ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : ""} transition-all`}
            />
          ))}
        </div>
      )}
    </BlockShell>
  );
}

export function LogoCloudSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  const logos = (props.logos as LogoItem[]) || [];
  return (
    <div className="space-y-3">
      <Field label="Título">
        <TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} placeholder="Empresas que confían en nosotros" />
      </Field>
      <Field label="Color título">
        <ColorField value={(props.titleColor as string) || "rgba(255,255,255,0.5)"} onChange={(v) => onChange({ titleColor: v })} />
      </Field>
      <Field label="Marquee animado" horizontal>
        <ToggleField value={!!(props.marquee)} onChange={(v) => onChange({ marquee: v })} />
      </Field>
      <Field label="Escala de grises" horizontal>
        <ToggleField value={!!(props.grayscale)} onChange={(v) => onChange({ grayscale: v })} />
      </Field>

      <SectionTitle>Logos</SectionTitle>
      <ArrayEditor
        items={logos}
        onChange={(items) => onChange({ logos: items })}
        defaultItem={{ src: "", alt: "" }}
        addLabel="Añadir logo"
        renderItem={(item, _idx, update, remove) => (
          <div className="p-2 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <ImageField value={item.src} onChange={(v) => update({ src: v })} />
            <Field label="Alt text">
              <TextField value={item.alt} onChange={(v) => update({ alt: v })} placeholder="Nombre empresa" />
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
