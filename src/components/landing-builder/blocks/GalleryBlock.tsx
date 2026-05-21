import { BlockShell, Field, TextField, ColorField, SelectField, ToggleField, SectionTitle, BgSettings, SpacingSettings, ArrayEditor, ImageField } from "../shared";

interface GalleryImage { src: string; alt: string; caption?: string }

export const galleryDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  title: "Galería de proyectos",
  titleColor: "#ffffff",
  accentColor: "#ffae00",
  columns: "3",
  gap: "4",
  rounded: true,
  images: [
    { src: "https://static.showit.co/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg", alt: "Letras 3D", caption: "Letras 3D corporativas" },
    { src: "https://static.showit.co/400/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png", alt: "Proyecto", caption: "Rotulación comercial" },
  ] as GalleryImage[],
};

export function GalleryBlock(props: Record<string, unknown>) {
  const images = (props.images as GalleryImage[]) || [];
  const cols = (props.columns as string) || "3";
  const gap = (props.gap as string) || "4";
  const accent = (props.accentColor as string) || "#ffae00";
  const gridCls: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-2 lg:grid-cols-4",
    "5": "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <BlockShell props={props}>
      {props.title && (
        <h2 data-sel-prop="title" className="text-3xl font-black text-center mb-8" style={{ color: (props.titleColor as string) || "#ffffff" }}>
          {props.title as string}
        </h2>
      )}
      <div className={`grid ${gridCls[cols] ?? "grid-cols-3"} gap-${gap}`}>
        {images.map((img, i) => (
          <div key={i} className={`overflow-hidden group relative ${props.rounded ? "rounded-xl" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                style={{ background: `linear-gradient(to top, ${accent}dd, transparent)` }}>
                <p className="text-xs font-semibold text-white">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

export function GallerySettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  const images = (props.images as GalleryImage[]) || [];
  return (
    <div className="space-y-3">
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Columnas">
        <SelectField value={(props.columns as string) || "3"} onChange={(v) => onChange({ columns: v })}
          options={["2","3","4","5"].map((n) => ({ value: n, label: n }))} />
      </Field>
      <Field label="Separación">
        <SelectField value={(props.gap as string) || "4"} onChange={(v) => onChange({ gap: v })}
          options={["1","2","3","4","6","8"].map((n) => ({ value: n, label: `${n} × 4px` }))} />
      </Field>
      <Field label="Bordes redondeados" horizontal>
        <ToggleField value={!!(props.rounded)} onChange={(v) => onChange({ rounded: v })} />
      </Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>

      <SectionTitle>Imágenes</SectionTitle>
      <ArrayEditor
        items={images}
        onChange={(items) => onChange({ images: items })}
        defaultItem={{ src: "", alt: "", caption: "" }}
        addLabel="Añadir imagen"
        renderItem={(item, _idx, update, remove) => (
          <div className="p-2 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <ImageField value={item.src} onChange={(v) => update({ src: v })} />
            <Field label="Alt"><TextField value={item.alt} onChange={(v) => update({ alt: v })} /></Field>
            <Field label="Pie de foto"><TextField value={item.caption || ""} onChange={(v) => update({ caption: v })} /></Field>
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
