"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import type { SiteConfig } from "@/lib/site-config";
import { SITE_CONFIG_DEFAULTS } from "@/lib/site-config";

const HERO_IMG =
  "https://static.showit.co/1200/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png";
const HERO_CARD_IMG =
  "https://static.showit.co/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg";

/** Highlights the word "ideas" (case-insensitive) in brand colour. */
function HighlightedTitle({ title }: { title: string }) {
  const parts = title.split(/(ideas)/i);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === "ideas" ? (
          <span key={i} className="text-[var(--color-brand-500)]">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export function Hero({ config = SITE_CONFIG_DEFAULTS }: { config?: SiteConfig }) {
  const locale = useLocale();

  const bgImage = config.heroBgImage || HERO_IMG_FALLBACK;
  const cardImage = config.heroCardImage || HERO_CARD_IMG_FALLBACK;

  const miniStats = [
    { n: config.heroStat1Value, l: config.heroStat1Label },
    { n: config.heroStat2Value, l: config.heroStat2Label },
    { n: config.heroStat3Value, l: config.heroStat3Label },
  ];

  return (
    <section className="relative -mt-20 pt-20 overflow-hidden bg-[var(--color-ink-950)] text-white">
      <div className="absolute inset-0">
        <Image src={bgImage} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink-950)] via-[var(--color-ink-950)]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink-950)] via-transparent to-transparent" />
        <div className="absolute inset-0 grid-bg-dark opacity-40" />
        <div className="absolute inset-0 noise opacity-[0.06] mix-blend-overlay" />
      </div>

      <div className="pointer-events-none absolute -top-32 -right-40 w-[44rem] h-[44rem] rounded-full bg-[var(--color-brand-500)]/25 blur-[120px] glow-pulse" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 w-72 h-72 rounded-full bg-[var(--color-brand-500)]/20 blur-3xl float-slow" />

      <div className="container-x relative pt-16 pb-28 md:pt-24 md:pb-36 grid lg:grid-cols-12 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-8"
        >
          <span className="eyebrow">
            <Sparkles size={14} /> Ideas, LLC · Puerto Rico
          </span>

          <h1 className="heading-xl mt-5 text-balance">
            <HighlightedTitle title={config.heroTitle} />
          </h1>

          <p className="mt-7 text-lg md:text-xl text-white/75 max-w-2xl leading-relaxed">
            {config.heroSubtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/${locale}/cotizacion`} className="btn btn-brand text-base">
              {config.heroCtaPrimary} <ArrowRight size={18} />
            </Link>
            <Link href={`/${locale}/servicios`} className="btn btn-ghost-light text-base">
              <PlayCircle size={18} /> {config.heroCtaSecondary}
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-10 gap-y-5 text-white/85">
            {miniStats.map((s) => (
              <div key={s.l} className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-[var(--color-brand-500)]">{s.n}</span>
                <span className="text-sm text-white/70">{s.l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:block lg:col-span-4 relative"
        >
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
            <Image src={cardImage} alt="Trabajo destacado" fill sizes="(max-width: 1024px) 0px, 33vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-brand-400)] font-bold">{config.heroCardBadge}</span>
              <h3 className="text-xl font-bold mt-1">{config.heroCardTitle}</h3>
            </div>
          </div>

          <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-900)] grid place-items-center shadow-2xl rotate-6">
            <div className="text-center leading-tight">
              <div className="text-3xl font-black">PR</div>
              <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5">Hecho aquí</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
