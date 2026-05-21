"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  ArrowUpRight, Hammer, Wrench, Megaphone, Printer, Truck, Brush, Compass, Zap
} from "lucide-react";
import type { Service } from "@prisma/client";
import type { SiteConfig } from "@/lib/site-config";
import { SITE_CONFIG_DEFAULTS } from "@/lib/site-config";
import { ServiceModal } from "./ServiceModal";
import Link from "next/link";

const ICONS: Record<string, typeof Hammer> = {
  hammer: Hammer, wrench: Wrench, megaphone: Megaphone, printer: Printer,
  truck: Truck, brush: Brush, compass: Compass, zap: Zap
};

export function ServicesGrid({ services, config = SITE_CONFIG_DEFAULTS }: { services: Service[]; config?: SiteConfig }) {
  const locale = useLocale();
  const [selected, setSelected] = useState<Service | null>(null);

  return (
    <section className="section relative bg-[var(--color-ink-950)] overflow-hidden">
      {selected && (
        <ServiceModal
          service={selected}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      )}
      <div className="absolute inset-0 grid-bg-dark opacity-40 pointer-events-none" />
      <div className="aurora opacity-60" />

      <div className="container-x relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="eyebrow">{config.servicesEyebrow}</span>
            <h2 className="heading-lg mt-4 text-balance">
              {config.servicesTitle}
            </h2>
            <p className="mt-5 text-white/70 text-lg">{config.servicesSubtitle}</p>
          </div>
          <Link href={`/${locale}/servicios`} className="btn btn-outline self-start md:self-end">
            {config.servicesMore} <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = ICONS[s.icon ?? ""] ?? Printer;
            const title = locale === "es" ? s.titleEs : s.titleEn;
            const desc = locale === "es" ? s.descEs : s.descEn;
            return (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                onClick={() => setSelected(s)}
                className="card overflow-hidden group relative tilt cursor-pointer"
              >
                <span className="absolute top-0 left-0 h-1 w-0 bg-[var(--color-brand-500)] group-hover:w-full transition-all duration-500 z-10" />

                {s.image && (
                  <div className="relative aspect-[16/10] bg-black/30 overflow-hidden">
                    <Image
                      src={s.image}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink-900)]/80 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[var(--color-ink-900)]/80 backdrop-blur text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-500)]">
                      0{i + 1}
                    </div>
                  </div>
                )}

                <div className="p-7">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] grid place-items-center group-hover:bg-[var(--color-brand-500)] group-hover:text-[var(--color-ink-900)] transition-colors">
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-brand-500)]/40 to-transparent" />
                  </div>
                  <h3 className="heading-md group-hover:text-[var(--color-brand-400)] transition-colors">{title}</h3>
                  <p className="mt-3 text-white/65 leading-relaxed line-clamp-4">{desc}</p>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    Conoce más
                    <ArrowUpRight
                      size={16}
                      className="text-[var(--color-brand-400)] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                    />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
