"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, User as UserIcon, Building2, Phone, Sparkles, ArrowRight } from "lucide-react";

type Mode = "login" | "register";
type Ctx = { open: (mode?: Mode) => void; close: () => void };
const AuthModalCtx = createContext<Ctx | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalCtx);
  if (!ctx) throw new Error("useAuthModal must be inside AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  const open = useCallback((m: Mode = "login") => {
    setMode(m);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <AuthModalCtx.Provider value={{ open, close }}>
      {children}
      <AuthModal isOpen={isOpen} mode={mode} setMode={setMode} onClose={close} />
    </AuthModalCtx.Provider>
  );
}

function AuthModal({
  isOpen, mode, setMode, onClose
}: { isOpen: boolean; mode: Mode; setMode: (m: Mode) => void; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales inválidas. Intenta de nuevo.");
    } else {
      onClose();
      router.refresh();
      window.location.assign("/portal");
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      company: String(fd.get("company") ?? ""),
      phone: String(fd.get("phone") ?? "")
    };
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }
    // auto sign-in
    const signed = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false
    });
    setLoading(false);
    if (signed?.error) {
      setSuccess("Cuenta creada. Inicia sesión para continuar.");
      setMode("login");
    } else {
      onClose();
      router.refresh();
      window.location.assign("/portal");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[var(--color-ink-950)]/95 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--color-brand-500)]/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full grid place-items-center bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition z-10"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>

            <div className="relative p-7">
              {/* Header */}
              <div className="flex items-center gap-2 text-[var(--color-brand-500)] text-xs font-black uppercase tracking-widest">
                <Sparkles size={14} />
                {mode === "login" ? "Bienvenido" : "Crear cuenta"}
              </div>
              <h2 className="text-3xl font-extrabold mt-2 leading-tight">
                {mode === "login" ? "Accede a tu portal" : "Únete a Ideas, LLC"}
              </h2>
              <p className="text-sm text-white/60 mt-1">
                {mode === "login"
                  ? "Gestiona órdenes, facturas y proyectos."
                  : "Crea tu cuenta de cliente y comienza a cotizar."}
              </p>

              {/* Tabs */}
              <div className="mt-5 grid grid-cols-2 p-1 rounded-full bg-white/5 border border-white/10 text-sm font-bold">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                    className={`relative py-2 rounded-full transition-colors ${
                      mode === m ? "text-[var(--color-ink-900)]" : "text-white/65 hover:text-white"
                    }`}
                  >
                    {mode === m && (
                      <motion.span
                        layoutId="auth-tab"
                        className="absolute inset-0 rounded-full bg-[var(--color-brand-500)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{m === "login" ? "Iniciar sesión" : "Registro"}</span>
                  </button>
                ))}
              </div>

              {/* Forms */}
              <div className="mt-5">
                {mode === "login" ? (
                  <form id="login-form" onSubmit={handleLogin} className="space-y-3">
                    <Field icon={<Mail size={14} />} name="email" type="email" placeholder="tu@correo.com" required autoFocus />
                    <Field icon={<Lock size={14} />} name="password" type="password" placeholder="Contraseña" required />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {success && <p className="text-emerald-400 text-sm">{success}</p>}
                    <button disabled={loading} className="group relative w-full py-3 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-900)] font-black text-sm shadow-[0_10px_25px_-8px_rgba(255,174,0,0.5)] hover:shadow-[0_18px_40px_-12px_rgba(255,174,0,0.7)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0">
                      {loading ? "Conectando..." : (
                        <span className="inline-flex items-center justify-center gap-2">Entrar <ArrowRight size={14} /></span>
                      )}
                    </button>

                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <Field icon={<UserIcon size={14} />} name="name" placeholder="Nombre completo" required autoFocus />
                    <Field icon={<Mail size={14} />} name="email" type="email" placeholder="tu@correo.com" required />
                    <Field icon={<Lock size={14} />} name="password" type="password" placeholder="Contraseña (mín. 6)" required minLength={6} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field icon={<Building2 size={14} />} name="company" placeholder="Empresa" />
                      <Field icon={<Phone size={14} />} name="phone" placeholder="Teléfono" />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button disabled={loading} className="w-full py-3 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-900)] font-black text-sm shadow-[0_10px_25px_-8px_rgba(255,174,0,0.5)] hover:shadow-[0_18px_40px_-12px_rgba(255,174,0,0.7)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0">
                      {loading ? "Creando..." : (
                        <span className="inline-flex items-center justify-center gap-2">Crear cuenta <ArrowRight size={14} /></span>
                      )}
                    </button>
                    <p className="text-[11px] text-white/45 text-center pt-1">
                      Al registrarte aceptas nuestros términos y política de privacidad.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon, ...props
}: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative block">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45">{icon}</span>
      <input
        {...props}
        className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[var(--color-brand-500)]/60 focus:bg-white/[0.07] transition"
      />
    </label>
  );
}
