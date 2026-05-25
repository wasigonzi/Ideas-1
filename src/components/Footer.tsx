"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, Phone, MapPin, MessageCircle, ArrowUp } from "lucide-react";
import { Logo } from "./Logo";

type MemberItem = { href: string; label: string; logo: string };

export function Footer({
  whatsapp = "19393264007",
  description,
  members,
}: {
  whatsapp?: string;
  description?: string;
  members?: MemberItem[];
}) {
  const year = new Date().getFullYear();

  const resolvedDescription = description ??
    "Impresión y rotulación de gran formato en Puerto Rico. Empresa puertorriqueña dedicada a la manufactura de rótulos e impresiones de alto volumen.";

  const defaultMembers: MemberItem[] = [
    { href: "https://asociacion.hechoen.pr/quienes-somos/", label: "Hecho en PR", logo: "/logos/hecho-en-pr.svg" },
    { href: "https://www.midapr.com/", label: "MIDA", logo: "/logos/mida.png" },
    { href: "https://www.smepr.org/", label: "SME PR", logo: "/logos/sme-pr.svg" },
  ];
  const resolvedMembers = members ?? defaultMembers;

  const scrollTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative mt-24 text-white">
      {/* ── Decorative top divider ───────────────────────────────── */}
      <div aria-hidden className="relative h-24 -mb-px overflow-hidden">
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-24 text-[var(--color-ink-900)]"
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,96 L0,40 C180,80 360,8 600,32 C840,56 1020,96 1260,56 L1440,24 L1440,96 Z"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-[60px] h-px bg-gradient-to-r from-transparent via-[var(--color-brand-500)]/60 to-transparent" />
      </div>

      <div className="relative bg-[var(--color-ink-900)] overflow-hidden">
        {/* Background ambience */}
        <div className="pointer-events-none absolute inset-0 grid-bg-dark opacity-25" />
        <div className="pointer-events-none absolute -top-32 left-1/4 w-[36rem] h-[36rem] rounded-full bg-[var(--color-brand-500)]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 w-[30rem] h-[30rem] rounded-full bg-[var(--color-accent-red)]/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-500)]/40 to-transparent" />

        {/* ── Main grid ────────────────────────────────────────── */}
        <div className="container-x relative pt-20 md:pt-24 pb-12 grid md:grid-cols-12 gap-12 md:gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="relative inline-flex items-center justify-center group">
              <span className="logo-bulb inline-block transition-transform duration-300 group-hover:scale-105">
                <Logo width={150} height={52} />
              </span>
            </div>

            <p className="mt-7 text-white/70 text-sm leading-relaxed max-w-sm">
              {resolvedDescription}
            </p>

            <div className="mt-7 flex items-center gap-3">
              {[
                { href: "https://www.facebook.com/ideasprllc/", Icon: Facebook, label: "Facebook", hover: "hover:bg-[#1877F2] hover:border-[#1877F2]" },
                { href: "https://www.instagram.com/ideas_llc/", Icon: Instagram, label: "Instagram", hover: "hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:border-transparent" },
                { href: `https://wa.me/${whatsapp}`, Icon: MessageCircle, label: "WhatsApp", hover: "hover:bg-[#25D366] hover:border-[#25D366]" }
              ].map(({ href, Icon, label, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`group relative w-11 h-11 rounded-xl border border-white/10 bg-white/5 grid place-items-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 hover:shadow-lg ${hover}`}
                >
                  <Icon size={17} className="transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div className="md:col-span-2 md:pt-6">
            <ul className="space-y-3 text-sm text-white/75">
              {[
                { href: "/", label: "Inicio" },
                { href: "/servicios", label: "Servicios" },
                { href: "/proyectos", label: "Proyectos" },
                { href: "/nosotros", label: "Nosotros" },
                { href: "/cotizacion", label: "Cotización" }
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 hover:text-[var(--color-brand-400)] transition-colors"
                  >
                    <span className="h-px w-0 bg-[var(--color-brand-500)] transition-all duration-300 group-hover:w-3" />
                    <span className="transition-transform duration-300 group-hover:translate-x-1">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3 md:pt-6">
            <ul className="space-y-4 text-sm text-white/85">
              <li>
                <a
                  href="mailto:ventas@printingideaspr.com"
                  className="group flex items-start gap-3 hover:text-[var(--color-brand-400)] transition-colors"
                >
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-brand-500)]/10 grid place-items-center text-[var(--color-brand-500)] transition-all group-hover:bg-[var(--color-brand-500)] group-hover:text-[var(--color-ink-900)] group-hover:scale-110">
                    <Mail size={15} />
                  </span>
                  <span className="pt-2 break-all">ventas@printingideaspr.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:9393563399"
                  className="group flex items-start gap-3 hover:text-[var(--color-brand-400)] transition-colors"
                >
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-brand-500)]/10 grid place-items-center text-[var(--color-brand-500)] transition-all group-hover:bg-[var(--color-brand-500)] group-hover:text-[var(--color-ink-900)] group-hover:scale-110">
                    <Phone size={15} />
                  </span>
                  <span className="pt-2">939-356-3399</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/75">
                <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-brand-500)]/10 grid place-items-center text-[var(--color-brand-500)]">
                  <MapPin size={15} />
                </span>
                <span className="pt-1 leading-relaxed">
                  Industrial Park<br />
                  Calle 272 Lot 3<br />
                  Carolina, PR 00982
                </span>
              </li>
            </ul>
          </div>

          {/* Memberships */}
          <div className="md:col-span-3 md:pt-6">
            <div className="flex flex-wrap gap-3">
              {resolvedMembers.filter((m) => m.logo).map((m) => (
                <a
                  key={m.label}
                  href={m.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative inline-flex items-center justify-center px-4 py-3 rounded-lg border border-white/10 bg-white/[0.04] transition-all hover:border-[var(--color-brand-500)]/60 hover:bg-white/10 hover:-translate-y-0.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.logo}
                    alt={m.label}
                    loading="lazy"
                    className="h-8 w-auto max-w-[110px] object-contain brightness-0 invert opacity-50 transition-opacity group-hover:opacity-90"
                  />
                </a>
              ))}
            </div>

            <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/40">
              Lun – Vie · 8:00am – 5:00pm
            </p>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────── */}
        <div className="relative border-t border-white/10">
          <div className="container-x py-6 text-xs text-white/55 flex flex-col md:flex-row items-center justify-between gap-3">
            <span>© {year} Ideas, LLC. Todos los derechos reservados.</span>
            <span className="flex items-center gap-1.5">
              Hecho con{" "}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pr-flag.svg" alt="Puerto Rico" className="inline-block w-5 h-auto rounded-[2px] animate-pulse" style={{ verticalAlign: "middle" }} />
              {" "}en Puerto Rico
            </span>
            <div className="flex items-center gap-4">
              <span className="text-white/30 text-[10px] tracking-widest uppercase select-none pointer-events-none">
                Built by{" "}
                <a
                  href="https://www.visualabstudios.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-white/80 transition-colors pointer-events-auto"
                  tabIndex={-1}
                  onClick={(e) => e.stopPropagation()}
                >
                  Visualab Studios
                </a>
              </span>
              <button
                onClick={scrollTop}
                aria-label="Volver arriba"
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-[var(--color-brand-400)] hover:border-[var(--color-brand-500)]/50 hover:bg-[var(--color-brand-500)]/10 transition-all"
              >
                <ArrowUp size={13} className="transition-transform group-hover:-translate-y-0.5" />
                Arriba
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
