"use client";

import { useState } from "react";

export function ImageUploader({ value, onChange, label = "Imagen" }: { value?: string | null; onChange: (url: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  async function handle(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (j.url) onChange(j.url);
  }
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border" />}
        <label className="btn btn-outline text-sm cursor-pointer">
          {busy ? "Subiendo..." : value ? "Cambiar" : "Subir"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
          />
        </label>
        {value && (
          <button type="button" className="text-sm text-red-600" onClick={() => onChange("")}>Quitar</button>
        )}
      </div>
    </div>
  );
}
