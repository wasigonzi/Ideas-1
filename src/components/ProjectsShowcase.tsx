"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@prisma/client";
import type { SiteConfig } from "@/lib/site-config";
import { SITE_CONFIG_DEFAULTS } from "@/lib/site-config";

export function ProjectsShowcase({ projects, config = SITE_CONFIG_DEFAULTS }: { projects: Project[]; config?: SiteConfig }) {
  const locale = useLocale();

  return (
    <section className="section bg-[var(--color-ink-900)] relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-[var(--color-brand-500)]/15 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-[var(--color-accent-red)]/8 blur-3xl" />

      <div className="container-x relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="eyebrow">{config.projectsEyebrow}</span>
            <h2 className="heading-lg mt-4 text-balance">{config.projectsTitle}</h2>
            <p className="mt-5 text-white/70 text-lg">{config.projectsSubtitle}</p>
          </div>
          <Link href={`/${locale}/proyectos`} className="btn btn-outline self-start md:self-end">
            {config.projectsViewAll} <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-6 gap-5">
          {projects.map((p, i) => {
            const title = locale === "es" ? p.titleEs : p.titleEn;
            const isFeatured = i === 0;
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: i * 0.05 }}
                className={`group relative overflow-hidden rounded-3xl bg-black ${
                  isFeatured ? "md:col-span-4 md:row-span-2 aspect-[4/5] md:aspect-auto md:min-h-[640px]" : "md:col-span-2 aspect-[4/5]"
                }`}
              >
                {p.cover ? (
                  <Image
                    src={p.cover}
                    alt={title}
                    fill
                    sizes={isFeatured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                    className="object-cover opacity-85 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-ink-700)] to-[var(--color-ink-900)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <div className="absolute inset-0 border-2 border-[var(--color-brand-500)]/0 group-hover:border-[var(--color-brand-500)]/80 rounded-3xl transition-colors duration-500 pointer-events-none" />

                <div className="absolute top-5 left-5 z-10">
                  {p.category && (
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-900)] text-[10px] font-black uppercase tracking-widest">
                      {p.category}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <h3 className={`font-black ${isFeatured ? "text-3xl md:text-4xl" : "text-xl"} leading-tight`}>{title}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand-400)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Ver proyecto <ArrowUpRight size={16} />
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
