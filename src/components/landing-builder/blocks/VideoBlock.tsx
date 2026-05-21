import { BlockShell, Field, TextField, ColorField, SelectField, ToggleField, NumberField, SectionTitle, BgSettings, SpacingSettings } from "../shared";

export const videoDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "960px",
  title: "Video corporativo",
  subtitle: "",
  titleColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.6)",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  aspectRatio: "16/9",
  rounded: true,
  autoplay: false,
};

function getEmbedUrl(url: string, autoplay: boolean): string {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let videoId = u.searchParams.get("v") || u.pathname.split("/").pop() || "";
      if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1&mute=1" : ""}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const videoId = u.pathname.split("/").filter(Boolean).pop() || "";
      return `https://player.vimeo.com/video/${videoId}${autoplay ? "?autoplay=1&muted=1" : ""}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function VideoBlock(props: Record<string, unknown>) {
  const videoUrl = (props.videoUrl as string) || "";
  const embedUrl = getEmbedUrl(videoUrl, !!(props.autoplay));
  const aspect = (props.aspectRatio as string) || "16/9";
  const paddingBottom = aspect === "4/3" ? "75%" : aspect === "1/1" ? "100%" : "56.25%";

  return (
    <BlockShell props={props}>
      {(props.title || props.subtitle) && (
        <div className="text-center mb-8">
          {props.title && (
            <h2 data-sel-prop="title" className="text-3xl font-black mb-2" style={{ color: (props.titleColor as string) || "#ffffff" }}>
              {props.title as string}
            </h2>
          )}
          {props.subtitle && (
            <p data-sel-prop="subtitle" className="text-base" style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.6)" }}>
              {props.subtitle as string}
            </p>
          )}
        </div>
      )}
      <div className={`overflow-hidden shadow-2xl ${props.rounded ? "rounded-2xl" : ""}`}
        style={{ position: "relative", paddingBottom, height: 0 }}>
        {videoUrl ? (
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            title="Video"
          />
        ) : (
          <div className="absolute inset-0 bg-white/5 border border-dashed border-white/15 flex items-center justify-center text-white/30 text-sm">
            Ingresa una URL de YouTube o Vimeo
          </div>
        )}
      </div>
    </BlockShell>
  );
}

export function VideoSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} /></Field>
      <Field label="URL del video">
        <TextField value={(props.videoUrl as string) || ""} onChange={(v) => onChange({ videoUrl: v })} placeholder="https://youtube.com/watch?v=..." />
      </Field>
      <Field label="Aspect ratio">
        <SelectField value={(props.aspectRatio as string) || "16/9"} onChange={(v) => onChange({ aspectRatio: v })}
          options={[{ value: "16/9", label: "16:9 (Estándar)" }, { value: "4/3", label: "4:3" }, { value: "1/1", label: "1:1 (Cuadrado)" }]} />
      </Field>
      <Field label="Bordes redondeados" horizontal>
        <ToggleField value={!!(props.rounded)} onChange={(v) => onChange({ rounded: v })} />
      </Field>
      <Field label="Autoplay (muted)" horizontal>
        <ToggleField value={!!(props.autoplay)} onChange={(v) => onChange({ autoplay: v })} />
      </Field>
      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
