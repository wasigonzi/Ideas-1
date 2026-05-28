"use client";
import { useState } from "react";
import { BlockShell, Field, TextField, ColorField, ToggleField, SectionTitle, BgSettings, SpacingSettings } from "../shared";

export const contactFormDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "680px",
  title: "Solicita una cotización",
  subtitle: "Completa el formulario y te contactamos a la brevedad.",
  titleColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.6)",
  accentColor: "#ffae00",
  showName: true,
  showEmail: true,
  showPhone: true,
  showCompany: true,
  showMessage: true,
  submitText: "Enviar mensaje",
  successMessage: "¡Gracias! Nos pondremos en contacto pronto.",
};

export function ContactFormBlock(props: Record<string, any>) {
  const accent = (props.accentColor as string) || "#ffae00";
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handle = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          description: form.message,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", company: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputCls = "w-full rounded-xl bg-white/6 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)] transition-colors";

  return (
    <BlockShell props={props}>
      <div className="text-center mb-10">
        {props.title && (
          <h2 data-sel-prop="title" className="text-3xl sm:text-4xl font-black mb-3"
            style={{ color: (props.titleColor as string) || "#ffffff" }}>
            {props.title as string}
          </h2>
        )}
        {props.subtitle && (
          <p data-sel-prop="subtitle" className="text-base" style={{ color: (props.subtitleColor as string) || "rgba(255,255,255,0.6)" }}>
            {props.subtitle as string}
          </p>
        )}
      </div>

      {status === "success" ? (
        <div className="text-center py-12 px-6 rounded-2xl border"
          style={{ borderColor: `${accent}40`, background: `${accent}10`, color: accent }}>
          <p className="text-xl font-bold mb-1">✓ {(props.successMessage as string) || "¡Mensaje enviado!"}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {props.showName && (
            <input type="text" required placeholder="Nombre completo" value={form.name} onChange={handle("name")} className={inputCls} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {props.showEmail && (
              <input type="email" required placeholder="Correo electrónico" value={form.email} onChange={handle("email")} className={inputCls} />
            )}
            {props.showPhone && (
              <input type="tel" placeholder="Teléfono" value={form.phone} onChange={handle("phone")} className={inputCls} />
            )}
          </div>
          {props.showCompany && (
            <input type="text" placeholder="Empresa" value={form.company} onChange={handle("company")} className={inputCls} />
          )}
          {props.showMessage && (
            <textarea rows={5} placeholder="Describe tu proyecto o necesidad…" value={form.message} onChange={handle("message")} className={`${inputCls} resize-y`} />
          )}
          {status === "error" && (
            <p className="text-sm text-red-400">Ocurrió un error. Por favor intenta de nuevo.</p>
          )}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: accent, color: "#0a1422" }}>
            {status === "sending" ? "Enviando…" : (props.submitText as string) || "Enviar"}
          </button>
        </form>
      )}
    </BlockShell>
  );
}

export function ContactFormSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Título"><TextField value={(props.title as string) || ""} onChange={(v) => onChange({ title: v })} multiline /></Field>
      <Field label="Color título"><ColorField value={(props.titleColor as string) || "#ffffff"} onChange={(v) => onChange({ titleColor: v })} /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) || ""} onChange={(v) => onChange({ subtitle: v })} multiline /></Field>
      <Field label="Color acento"><ColorField value={(props.accentColor as string) || "#ffae00"} onChange={(v) => onChange({ accentColor: v })} /></Field>
      <Field label="Texto botón"><TextField value={(props.submitText as string) || ""} onChange={(v) => onChange({ submitText: v })} /></Field>
      <Field label="Msg éxito"><TextField value={(props.successMessage as string) || ""} onChange={(v) => onChange({ successMessage: v })} /></Field>

      <SectionTitle>Campos</SectionTitle>
      <Field label="Nombre" horizontal><ToggleField value={!!(props.showName)} onChange={(v) => onChange({ showName: v })} /></Field>
      <Field label="Email" horizontal><ToggleField value={!!(props.showEmail)} onChange={(v) => onChange({ showEmail: v })} /></Field>
      <Field label="Teléfono" horizontal><ToggleField value={!!(props.showPhone)} onChange={(v) => onChange({ showPhone: v })} /></Field>
      <Field label="Empresa" horizontal><ToggleField value={!!(props.showCompany)} onChange={(v) => onChange({ showCompany: v })} /></Field>
      <Field label="Mensaje" horizontal><ToggleField value={!!(props.showMessage)} onChange={(v) => onChange({ showMessage: v })} /></Field>

      <SectionTitle>Fondo</SectionTitle>
      <BgSettings props={props} onChange={onChange} />
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
