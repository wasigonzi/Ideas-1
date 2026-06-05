"use client";
import { BlockShell } from "../shared";
import { QuoteForm } from "../../QuoteForm";

export const quoteFormDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 80,
  padBottom: 80,
  maxWidth: "1200px",
  eyebrow: "Cotización",
  title: "Solicita una cotización",
  subtitle: "Llena el formulario y nuestro equipo te responderá en menos de 24 horas.",
  phone: "939-356-3399",
  email: "ventas@printingideaspr.com",
  address: "Puerto Rico",
};

export function QuoteFormBlock(props: Record<string, any>) {
  // In editor mode (props.__editorMode), show a placeholder so blocks are draggable.
  // On the live page, render the real form.
  const isEditor = !!(props.__editorMode);

  return (
    <BlockShell props={props}>
      <div className="grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          {props.eyebrow && <span className="eyebrow">{props.eyebrow as string}</span>}
          {props.title && (
            <h2 data-sel-prop="title" className="heading-xl mt-3">{props.title as string}</h2>
          )}
          {props.subtitle && (
            <p data-sel-prop="subtitle" className="mt-5 text-white/70 text-lg leading-relaxed">{props.subtitle as string}</p>
          )}
          <div className="mt-8 space-y-3 text-sm text-white/85">
            {props.phone && <div>📞 {props.phone as string}</div>}
            {props.email && <div>✉️ {props.email as string}</div>}
            {props.address && <div>📍 {props.address as string}</div>}
          </div>
        </div>
        <div className="lg:col-span-3">
          {isEditor ? (
            /* Editor placeholder */
            <div className="card p-8 space-y-4 opacity-60 pointer-events-none select-none">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-white/40 text-sm">Nombre</div>
                <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-white/40 text-sm">Email</div>
              </div>
              <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-white/40 text-sm">Teléfono</div>
              <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-white/40 text-sm">Empresa</div>
              <div className="h-28 bg-white/5 rounded-xl border border-white/10 flex items-start p-4 text-white/40 text-sm">Mensaje...</div>
              <div className="h-12 bg-brand-500 rounded-full flex items-center justify-center text-ink-900 font-bold text-sm">Enviar cotización</div>
              <p className="text-center text-xs text-white/30">(Formulario real visible en la página pública)</p>
            </div>
          ) : (
            <QuoteForm />
          )}
        </div>
      </div>
    </BlockShell>
  );
}

export function QuoteFormSettings({ props, onChange }: { props: Record<string, unknown>; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Eyebrow</label>
        <input className="input mt-1" value={(props.eyebrow as string) ?? ""} onChange={(e) => onChange({ eyebrow: e.target.value })} />
      </div>
      <div>
        <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Título</label>
        <input className="input mt-1" value={(props.title as string) ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Subtítulo</label>
        <textarea className="textarea mt-1 h-20" value={(props.subtitle as string) ?? ""} onChange={(e) => onChange({ subtitle: e.target.value })} />
      </div>
      <div>
        <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Teléfono</label>
        <input className="input mt-1" value={(props.phone as string) ?? ""} onChange={(e) => onChange({ phone: e.target.value })} />
      </div>
      <div>
        <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Email</label>
        <input className="input mt-1" value={(props.email as string) ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
      </div>
      <div>
        <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Dirección</label>
        <input className="input mt-1" value={(props.address as string) ?? ""} onChange={(e) => onChange({ address: e.target.value })} />
      </div>
    </div>
  );
}
