"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error]", error);
  }, [error]);

  return (
    <div className="p-8 text-center space-y-3">
      <h2 className="text-xl font-bold">Error en el panel de administración</h2>
      <p className="text-white/65 text-sm">{error?.message || "Ocurrió un error inesperado."}</p>
      <button
        onClick={() => reset()}
        className="btn btn-primary inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-brand-500,#ffae00)] text-black font-semibold"
      >
        Reintentar
      </button>
    </div>
  );
}
