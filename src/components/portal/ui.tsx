// Pure presentational pills/cards — safe to import from client OR server components.

export function StatCard({
  label, value, hint, accent
}: { label: string; value: React.ReactNode; hint?: string; accent?: "brand" | "green" | "red" | "blue" }) {
  const accentMap: Record<string, string> = {
    brand: "from-[var(--color-brand-500)]/15 to-transparent border-[var(--color-brand-500)]/30 text-[var(--color-brand-400)]",
    green: "from-emerald-500/15 to-transparent border-emerald-500/30 text-emerald-400",
    red:   "from-red-500/15 to-transparent border-red-500/30 text-red-400",
    blue:  "from-sky-500/15 to-transparent border-sky-500/30 text-sky-400"
  };
  const accentCls = accent ? accentMap[accent] : "from-white/5 to-transparent border-white/10 text-white";
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${accentCls}`}>
      <div className="text-xs uppercase tracking-widest text-white/55">{label}</div>
      <div className="text-3xl font-extrabold mt-2">{value}</div>
      {hint && <div className="text-xs text-white/55 mt-1">{hint}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-white/10 text-white/80",
    in_progress: "bg-sky-500/15 text-sky-300",
    review: "bg-amber-500/15 text-amber-300",
    produccion: "bg-orange-500/15 text-orange-300",
    completed: "bg-emerald-500/15 text-emerald-300",
    cancelled: "bg-red-500/15 text-red-300",
    todo: "bg-white/10 text-white/80",
    done: "bg-emerald-500/15 text-emerald-300",
    blocked: "bg-red-500/15 text-red-300",
    new: "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)]",
    paid: "bg-emerald-500/15 text-emerald-300",
    overdue: "bg-red-500/15 text-red-300",
    reviewed: "bg-sky-500/15 text-sky-300",
    quoted: "bg-amber-500/15 text-amber-300",
    won: "bg-emerald-500/15 text-emerald-300",
    lost: "bg-red-500/15 text-red-300"
  };
  const labels: Record<string, string> = {
    pending: "Pendiente", in_progress: "En progreso", review: "Para revisión",
    produccion: "Producción",
    completed: "Completado", cancelled: "Cancelado", todo: "Por hacer",
    done: "Hecho", blocked: "Bloqueado", new: "Nuevo", paid: "Pagado",
    overdue: "Vencida", reviewed: "Revisado", quoted: "Cotizado",
    won: "Ganado", lost: "Perdido"
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${map[status] ?? "bg-white/10"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-white/5 text-white/55",
    normal: "bg-white/10 text-white/75",
    high: "bg-amber-500/15 text-amber-300",
    urgent: "bg-red-500/15 text-red-300"
  };
  const labels: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente" };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${map[priority] ?? "bg-white/10"}`}>
      {labels[priority] ?? priority}
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-[var(--color-brand-500)]" style={{ width: `${pct}%` }} />
    </div>
  );
}
