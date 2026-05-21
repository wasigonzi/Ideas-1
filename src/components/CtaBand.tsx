"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import type { SiteConfig } from "@/lib/site-config";
import { SITE_CONFIG_DEFAULTS } from "@/lib/site-config";

export function CtaBand({ config = SITE_CONFIG_DEFAULTS }: { config?: SiteConfig }) {
  const locale = useLocale();
  return (
    <section className="section bg-[var(--color-ink-950)]">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--color-ink-800)] to-[var(--color-ink-900)] border border-white/8 text-white p-10 md:p-16"
        >
          <div className="absolute inset-0 grid-bg-dark opacity-30" />
          <div className="absolute -top-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-[var(--color-brand-500)]/25 blur-3xl glow-pulse" />
          <div className="absolute -bottom-32 -left-20 w-[24rem] h-[24rem] rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />

          <div className="relative grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] bg-[var(--color-brand-500)] text-[var(--color-ink-900)] px-3 py-1.5 rounded-full">
                <Sparkles size={12} /> Cotización gratuita
              </span>
              <h2 className="heading-lg mt-5 text-balance">{config.ctaTitle}</h2>
              <p className="mt-4 text-white/70 text-lg max-w-xl">{config.ctaSubtitle}</p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link href={`/${locale}/cotizacion`} className="btn btn-brand text-base">
                {config.ctaButton} <ArrowRight size={18} />
              </Link>
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                <MessageCircle size={18} /> WhatsApp directo
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
