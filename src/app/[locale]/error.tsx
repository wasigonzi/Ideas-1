"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center p-8 bg-[var(--color-bg-0,#060b14)] text-white">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold">Algo salió mal</h2>
        <p className="text-white/65 text-sm">
          {error?.message || "Ocurrió un error inesperado."}
        </p>
        <button
          onClick={() => reset()}
          className="btn btn-primary mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-brand-500,#ffae00)] text-black font-semibold"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
