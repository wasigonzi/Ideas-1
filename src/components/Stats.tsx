"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { SiteConfig } from "@/lib/site-config";
import { SITE_CONFIG_DEFAULTS } from "@/lib/site-config";

function useCount(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return val;
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setActive(true), { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const n = useCount(value, active);
  return (
    <div ref={ref} className="text-center px-4">
      <div className="text-5xl md:text-6xl font-black tracking-tight text-[var(--color-brand-500)] tabular-nums">
        {n.toLocaleString()}
        <span className="text-white">{suffix}</span>
      </div>
      <div className="mt-3 text-xs md:text-sm uppercase tracking-[0.2em] text-white/60 font-semibold">{label}</div>
    </div>
  );
}

export function Stats({ config = SITE_CONFIG_DEFAULTS }: { config?: SiteConfig }) {
  const STATS = [
    { key: "clients", label: "Clientes satisfechos", value: parseInt(config.statsClients) || 350, suffix: "+" },
    { key: "projects", label: "Proyectos realizados", value: parseInt(config.statsProjects) || 2943, suffix: "+" },
    { key: "space", label: "Pies cuadrados de taller", value: parseInt(config.statsSpace) || 8500, suffix: "" },
    { key: "years", label: "Años de experiencia", value: parseInt(config.statsYears) || 15, suffix: "+" },
  ] as const;

  return (
    <section className="relative py-20 bg-[var(--color-ink-900)] text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg-dark opacity-40" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-[var(--color-brand-500)]/15 blur-3xl" />

      <div className="container-x relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-y-12 divide-x divide-white/10"
        >
          {STATS.map((s) => (
            <Stat key={s.key} label={s.label} value={s.value} suffix={s.suffix} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
