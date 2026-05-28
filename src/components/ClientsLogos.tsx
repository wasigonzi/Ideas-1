"use client";

import Image from "next/image";
import type { SiteConfig } from "@/lib/site-config";
import { SITE_CONFIG_DEFAULTS } from "@/lib/site-config";

export function ClientsLogos({
  config = SITE_CONFIG_DEFAULTS,
  title,
}: {
  config?: SiteConfig;
  title?: string;
}) {
  const logos = config.logosItems.length > 0 ? config.logosItems : SITE_CONFIG_DEFAULTS.logosItems;
  const marqueeItems = [...logos, ...logos]; // duplicate for seamless loop

  return (
    <section className="py-16 bg-[var(--color-ink-900)] border-y border-white/5 relative">
      <div className="container-x relative">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-white/50 font-semibold mb-10">
          {title ?? config.logosTitle}
        </p>
      </div>
      <div className="marquee">
        <div className="marquee-track">
          {marqueeItems.map((l, i) => (
            <div
              key={`${l.alt}-${i}`}
              className="relative h-14 w-32 shrink-0 brightness-0 invert opacity-50 hover:opacity-100 hover:brightness-100 hover:invert-0 transition-all duration-300"
            >
              <Image src={l.src} alt={l.alt} fill className="object-contain" sizes="160px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
