"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Globe, Phone, Share2, Search, FileText, Palette, Upload, X, LayoutTemplate } from "lucide-react";

// ─── Default values ───────────────────────────────────────────────────────────
const DEFAULTS: Record<string, string> = {
  // General
  company_name: "Ideas, LLC",
  tagline_es: "Impresión & Rotulación · Puerto Rico",
  tagline_en: "Printing & Signage · Puerto Rico",
  logo_url: "https://static.showit.co/1200/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png",
  favicon_url: "",
  // Contact
  contact_email: "",
  contact_phone: "",
  whatsapp_number: "",
  address: "",
  business_hours_es: "Lunes – Viernes: 8:00 AM – 5:00 PM",
  business_hours_en: "Monday – Friday: 8:00 AM – 5:00 PM",
  // Social
  social_instagram: "",
  social_facebook: "",
  social_linkedin: "",
  social_youtube: "",
  social_tiktok: "",
  // SEO
  meta_title_es: "Ideas, LLC — Impresión y rotulación en Puerto Rico",
  meta_title_en: "Ideas, LLC — Printing & Signage in Puerto Rico",
  meta_description_es: "",
  meta_description_en: "",
  meta_keywords_es: "",
  meta_keywords_en: "",
  // Quotes
  quote_validity_days: "30",
  quote_terms_es: "50% al firmar la propuesta, 50% al completar el trabajo.",
  quote_terms_en: "50% upon signing the proposal, 50% upon project completion.",
  quote_footer_es: "Gracias por confiar en Ideas, LLC.",
  quote_footer_en: "Thank you for choosing Ideas, LLC.",
  // Footer
  footer_description: "Impresión y rotulación de gran formato en Puerto Rico. Empresa puertorriqueña dedicada a la manufactura de rótulos e impresiones de alto volumen.",
  footer_member_1_href: "https://asociacion.hechoen.pr/quienes-somos/",
  footer_member_1_label: "Hecho en PR",
  footer_member_1_logo: "/logos/hecho-en-pr.svg",
  footer_member_2_href: "https://www.midapr.com/",
  footer_member_2_label: "MIDA",
  footer_member_2_logo: "/logos/mida.png",
  footer_member_3_href: "https://www.smepr.org/",
  footer_member_3_label: "SME PR",
  footer_member_3_logo: "/logos/sme-pr.svg",
};

type Tab = "general" | "contacto" | "redes" | "seo" | "cotizaciones" | "footer";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "general",     label: "General",       icon: <Globe size={15} /> },
  { key: "contacto",    label: "Contacto",      icon: <Phone size={15} /> },
  { key: "redes",       label: "Redes Sociales",icon: <Share2 size={15} /> },
  { key: "seo",         label: "SEO",           icon: <Search size={15} /> },
  { key: "cotizaciones",label: "Cotizaciones",  icon: <FileText size={15} /> },
  { key: "footer",      label: "Footer",        icon: <LayoutTemplate size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/55 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/35 mt-1">{hint}</p>}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setValues((prev) => ({ ...prev, ...data }));
        setLoading(false);
      });
  }, []);

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImg(key: string, file: File) {
    setUploading((prev) => ({ ...prev, [key]: true }));
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setUploading((prev) => ({ ...prev, [key]: false }));
    if (j.url) set(key, j.url);
  }

  const imgField = (key: string) => (
    <div className="flex items-center gap-3">
      {values[key] && (
        <div className="relative group/prev shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={values[key]} alt="preview" className="h-12 w-12 rounded-lg object-contain border border-white/10 bg-white/5" />
          <button
            type="button"
            onClick={() => set(key, "")}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/prev:opacity-100 transition-opacity"
          >
            <X size={10} />
          </button>
        </div>
      )}
      <label className={`btn btn-outline text-sm cursor-pointer flex items-center gap-2 ${uploading[key] ? "opacity-50 pointer-events-none" : ""}`}>
        <Upload size={14} />
        {uploading[key] ? "Subiendo..." : values[key] ? "Cambiar imagen" : "Subir imagen"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadImg(key, e.target.files[0])}
        />
      </label>
    </div>
  );

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inp = (key: string, placeholder?: string) => (
    <input
      className="input w-full"
      value={values[key] ?? ""}
      onChange={(e) => set(key, e.target.value)}
      placeholder={placeholder}
    />
  );

  const ta = (key: string, rows = 3, placeholder?: string) => (
    <textarea
      className="textarea w-full"
      rows={rows}
      value={values[key] ?? ""}
      onChange={(e) => set(key, e.target.value)}
      placeholder={placeholder}
    />
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg">Configuración del sitio</h1>
          <p className="text-white/50 text-sm mt-1">Administra la información global de la web.</p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading}
          className="btn btn-primary flex items-center gap-2"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? "Guardado" : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-[var(--color-brand-500)] text-white"
                : "text-white/55 hover:text-white hover:bg-white/10"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-white/40">Cargando...</div>
      ) : (
        <div className="card p-6 space-y-6">

          {/* ── General ── */}
          {tab === "general" && (
            <>
              <SectionTitle icon={<Palette size={16} />} title="Branding" />
              <Field label="Nombre de la empresa">
                {inp("company_name", "Ideas, LLC")}
              </Field>
              <Row>
                <Field label="Tagline (español)">
                  {inp("tagline_es", "Impresión & Rotulación · Puerto Rico")}
                </Field>
                <Field label="Tagline (inglés)">
                  {inp("tagline_en", "Printing & Signage · Puerto Rico")}
                </Field>
              </Row>
              <Field label="Logotipo">
                {imgField("logo_url")}
              </Field>
              <Field label="Favicon" hint="Imagen cuadrada de al menos 32×32 px">
                {imgField("favicon_url")}
              </Field>
            </>
          )}

          {/* ── Contacto ── */}
          {tab === "contacto" && (
            <>
              <SectionTitle icon={<Phone size={16} />} title="Información de contacto" />
              <Row>
                <Field label="Email de contacto">
                  {inp("contact_email", "info@ideaspr.com")}
                </Field>
                <Field label="Teléfono">
                  {inp("contact_phone", "+1 (787) 000-0000")}
                </Field>
              </Row>
              <Field label="Número de WhatsApp" hint="Formato internacional sin espacios: +17875550000">
                {inp("whatsapp_number", "+17875550000")}
              </Field>
              <Field label="Dirección">
                {ta("address", 2, "Calle, Ciudad, PR 00000")}
              </Field>
              <Row>
                <Field label="Horario (español)">
                  {inp("business_hours_es", "Lunes – Viernes: 8:00 AM – 5:00 PM")}
                </Field>
                <Field label="Horario (inglés)">
                  {inp("business_hours_en", "Monday – Friday: 8:00 AM – 5:00 PM")}
                </Field>
              </Row>
            </>
          )}

          {/* ── Redes Sociales ── */}
          {tab === "redes" && (
            <>
              <SectionTitle icon={<Share2 size={16} />} title="Redes sociales" />
              {[
                { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
                { key: "social_facebook",  label: "Facebook",  placeholder: "https://facebook.com/..." },
                { key: "social_linkedin",  label: "LinkedIn",  placeholder: "https://linkedin.com/company/..." },
                { key: "social_youtube",   label: "YouTube",   placeholder: "https://youtube.com/@..." },
                { key: "social_tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@..." },
              ].map(({ key, label, placeholder }) => (
                <Field key={key} label={label}>
                  {inp(key, placeholder)}
                </Field>
              ))}
            </>
          )}

          {/* ── SEO ── */}
          {tab === "seo" && (
            <>
              <SectionTitle icon={<Search size={16} />} title="SEO y metadatos" />
              <Row>
                <Field label="Meta título (español)">
                  {inp("meta_title_es")}
                </Field>
                <Field label="Meta título (inglés)">
                  {inp("meta_title_en")}
                </Field>
              </Row>
              <Row>
                <Field label="Meta descripción (español)" hint="Recomendado: 150–160 caracteres">
                  {ta("meta_description_es", 3)}
                </Field>
                <Field label="Meta descripción (inglés)" hint="Recommended: 150–160 characters">
                  {ta("meta_description_en", 3)}
                </Field>
              </Row>
              <Row>
                <Field label="Keywords (español)" hint="Separados por coma">
                  {inp("meta_keywords_es", "rótulos, impresión, viniles...")}
                </Field>
                <Field label="Keywords (inglés)" hint="Separated by comma">
                  {inp("meta_keywords_en", "signs, printing, vinyl...")}
                </Field>
              </Row>
            </>
          )}

          {/* ── Footer ── */}
          {tab === "footer" && (
            <>
              <SectionTitle icon={<LayoutTemplate size={16} />} title="Contenido del footer" />
              <Field label="Descripción bajo el logo">
                {ta("footer_description", 3, "Texto que aparece bajo el logotipo en el footer")}
              </Field>

              <SectionTitle icon={<LayoutTemplate size={16} />} title="Membresías / Asociaciones" />
              <p className="text-xs text-white/40 -mt-4">Configura hasta 3 insignias de asociaciones que aparecen en el footer.</p>

              {([1, 2, 3] as const).map((n) => (
                <div key={n} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Membresía {n}</p>
                  <Row>
                    <Field label="Nombre / Alt">
                      {inp(`footer_member_${n}_label`, "Nombre de la asociación")}
                    </Field>
                    <Field label="Enlace (href)">
                      {inp(`footer_member_${n}_href`, "https://...")}
                    </Field>
                  </Row>
                  <Field label="Logo" hint="Sube un PNG, SVG o JPG. Déjalo vacío para ocultar esta membresía.">
                    {imgField(`footer_member_${n}_logo`)}
                  </Field>
                </div>
              ))}
            </>
          )}

          {/* ── Cotizaciones ── */}
          {tab === "cotizaciones" && (
            <>
              <SectionTitle icon={<FileText size={16} />} title="Cotizaciones y propuestas" />
              <Field label="Validez de la cotización (días)" hint="Por defecto: 30 días">
                <input
                  className="input w-32"
                  type="number"
                  min={1}
                  max={365}
                  value={values.quote_validity_days ?? "30"}
                  onChange={(e) => set("quote_validity_days", e.target.value)}
                />
              </Field>
              <Row>
                <Field label="Términos de pago (español)">
                  {ta("quote_terms_es", 3, "50% al firmar...")}
                </Field>
                <Field label="Términos de pago (inglés)">
                  {ta("quote_terms_en", 3, "50% upfront...")}
                </Field>
              </Row>
              <Row>
                <Field label="Nota final del PDF (español)">
                  {ta("quote_footer_es", 2)}
                </Field>
                <Field label="Nota final del PDF (inglés)">
                  {ta("quote_footer_en", 2)}
                </Field>
              </Row>
            </>
          )}

        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-white/70 text-sm font-semibold pb-2 border-b border-white/10">
      {icon}
      {title}
    </div>
  );
}
