"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales inválidas");
    } else {
      router.push(`/${locale}/portal`);
      router.refresh();
    }
  }

  return (
    <section className="min-h-[80vh] grid place-items-center py-16">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-md">
        <h1 className="heading-md">{t("loginTitle")}</h1>
        <p className="text-white/65 text-sm mt-1">{t("loginSubtitle")}</p>

        <label className="text-sm font-medium mt-6 block">Email</label>
        <input name="email" type="email" required className="input mt-1" defaultValue="admin@printingideaspr.com" />

        <label className="text-sm font-medium mt-4 block">Contraseña</label>
        <input name="password" type="password" required className="input mt-1" />

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button disabled={loading} className="btn btn-primary w-full mt-6">
          {loading ? "..." : "Entrar"}
        </button>

        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-xs uppercase tracking-widest text-white/55 mb-3">Cuentas de demo</p>
          <ul className="space-y-1.5 text-xs text-white/70">
            <li><span className="text-[var(--color-brand-400)] font-semibold">Admin:</span> admin@printingideaspr.com / admin123</li>
            <li><span className="text-[var(--color-brand-400)] font-semibold">Empleado:</span> empleado@printingideaspr.com / empleado123</li>
            <li><span className="text-[var(--color-brand-400)] font-semibold">Cliente:</span> cliente@printingideaspr.com / cliente123</li>
          </ul>
        </div>
      </form>
    </section>
  );
}
