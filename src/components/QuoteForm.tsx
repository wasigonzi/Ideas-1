"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Status = "idle" | "loading" | "success" | "error";

export function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("bad");
      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-8 md:p-10 grid md:grid-cols-2 gap-5"
    >
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Nombre completo*</label>
        <input name="name" required className="input mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Correo electrónico*</label>
        <input name="email" type="email" required className="input mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Teléfono</label>
        <input name="phone" className="input mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Empresa (opcional)</label>
        <input name="company" className="input mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Servicio de interés</label>
        <select name="service" className="select mt-1">
          <option value="">—</option>
          <option>Manufactura</option>
          <option>Instalación</option>
          <option>Rotulación</option>
          <option>Impresión digital</option>
          <option>Otro</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Presupuesto estimado</label>
        <select name="budget" className="select mt-1">
          <option value="">—</option>
          <option>{"< $500"}</option>
          <option>$500 - $2,000</option>
          <option>$2,000 - $10,000</option>
          <option>{"> $10,000"}</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Fecha límite</label>
        <input name="deadline" type="date" className="input mt-1" />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Cuéntanos tu proyecto*</label>
        <textarea name="message" required rows={5} className="textarea mt-1" />
      </div>
      <div className="md:col-span-2 flex items-center justify-between gap-4 mt-2">
        <div className="text-sm">
          {status === "success" && <span className="text-green-400">¡Gracias! Recibimos tu solicitud y te contactaremos pronto.</span>}
          {status === "error" && <span className="text-red-400">Hubo un error. Inténtalo de nuevo.</span>}
        </div>
        <button disabled={status === "loading"} className="btn btn-primary">
          {status === "loading" ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </motion.form>
  );
}
