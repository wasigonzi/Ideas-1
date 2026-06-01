"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
      router.refresh();
      window.location.assign("/portal");
    }
  }

  return (
    <section className="min-h-[80vh] grid place-items-center py-16">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-md">
        <h1 className="heading-md">Acceso administrativo</h1>
        <p className="text-white/65 text-sm mt-1">Ingresa tus credenciales para continuar</p>

        <label className="text-sm font-medium mt-6 block">Email</label>
        <input name="email" type="email" required className="input mt-1" autoComplete="email" />

        <label className="text-sm font-medium mt-4 block">Contraseña</label>
        <input name="password" type="password" required className="input mt-1" autoComplete="current-password" />

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button disabled={loading} className="btn btn-primary w-full mt-6">
          {loading ? "..." : "Entrar"}
        </button>

      </form>
    </section>
  );
}
