"use client";

import { useEffect } from "react";
import Link from "next/link";

// Error boundary específico del editor de landing. Evita que un fallo del
// editor (JSON corrupto, bloque inválido, runtime del cliente) tumbe la ruta
// con un HTTP 500 sin contexto.
export default function LandingEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/landing error]", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center p-8 bg-[var(--color-bg-0,#060b14)] text-white">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold">No se pudo abrir el editor</h2>
        <p className="text-white/65 text-sm">
          {error?.message || "Ocurrió un error al cargar el editor de páginas."}
        </p>
        {error?.digest && (
          <p className="text-white/35 text-xs font-mono">ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="btn btn-primary inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-brand-500,#ffae00)] text-black font-semibold"
          >
            Reintentar
          </button>
          <Link
            href="/es/admin"
            className="btn btn-outline inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/20"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
