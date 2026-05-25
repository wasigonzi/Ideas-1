"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Phone, Mail, MapPin, MessageCircle, Instagram, Facebook,
  ArrowRight, Sparkles, LogIn, UserPlus, LayoutDashboard
} from "lucide-react";
import { Logo } from "./Logo";
import { useSession, signOut } from "next-auth/react";
import { useAuthModal } from "./AuthModal";

export function Navbar({ whatsapp = "19393264007" }: { whatsapp?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const { open: openAuth } = useAuthModal();
  const user = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined;

  // Liquid glass lens refs
  const navListRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);

  const handleNavLinkHover = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const lens = lensRef.current;
    const navList = navListRef.current;
    if (!lens || !navList) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = navList.getBoundingClientRect();
    const paddingLeft = parseFloat(getComputedStyle(navList).paddingLeft) || 0;
    const left = rect.left - parentRect.left - paddingLeft;
    lens.style.display = "flex";
    lens.style.width = `${rect.width}px`;
    lens.style.transform = `translate(${left}px, 0) scale(1.2, 1.36)`;
  }, []);

  const handleNavLeave = useCallback(() => {
    const lens = lensRef.current;
    if (lens) lens.style.display = "none";
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "/", label: "Inicio", exact: true },
    { href: "/servicios", label: "Servicios" },
    { href: "/proyectos", label: "Proyectos" },
    { href: "/nosotros", label: "Nosotros" }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ───── FIXED WRAPPER: top bar + main nav ───── */}
      <div className="fixed top-0 left-0 right-0 w-full z-40">

        {/* ── TOP BAR (phone / email / social) ── */}
        <div
          className={`hidden md:block text-white/85 text-xs transition-[max-height,opacity] duration-500 overflow-hidden ${
            scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
          }`}
        >
          <div className="container-x h-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="tel:9393563399" className="flex items-center gap-2 hover:text-[var(--color-brand-400)] transition-colors">
                <Phone size={12} className="text-[var(--color-brand-500)]" /> 939-356-3399
              </a>
              <a href="mailto:ventas@printingideaspr.com" className="flex items-center gap-2 hover:text-[var(--color-brand-400)] transition-colors">
                <Mail size={12} className="text-[var(--color-brand-500)]" /> ventas@printingideaspr.com
              </a>
              <span className="hidden xl:flex items-center gap-2 text-white/60">
                <MapPin size={12} className="text-[var(--color-brand-500)]" /> Carolina, PR 00982
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/50 hidden lg:inline">Síguenos</span>
              <a href="https://www.facebook.com/ideasprllc/" target="_blank" rel="noreferrer" className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 hover:text-[var(--color-brand-400)] transition-colors">
                <Facebook size={12} />
              </a>
              <a href="https://www.instagram.com/ideas_llc/" target="_blank" rel="noreferrer" className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 hover:text-[var(--color-brand-400)] transition-colors">
                <Instagram size={12} />
              </a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 hover:text-[#25D366] transition-colors">
                <MessageCircle size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* ───── MAIN NAV ───── */}
        <header
          className={`relative transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
            scrolled
              ? "mx-3 sm:mx-6 lg:mx-auto lg:max-w-5xl mt-2 rounded-2xl overflow-hidden liquid-glass"
              : "w-full"
          }`}
        >
        {/* Caustic top specular — animated light refraction */}
        <div
          className={`pointer-events-none absolute left-[8%] right-[8%] top-0 h-[1.5px] rounded-b-full lg-caustic transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(200,220,255,0.4) 15%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,1) 52%, rgba(200,220,255,0.4) 85%, transparent 100%)" }}
        />
        {/* Lens bottom reflection */}
        <div
          className={`pointer-events-none absolute left-[20%] right-[20%] bottom-0 h-[1px] rounded-t-full lg-lens transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.45) 60%, transparent)" }}
        />

        <div className={`flex items-center justify-between px-4 sm:px-6 transition-all duration-500 ${scrolled ? "h-16 container-x" : "container-x h-20"}`}>
          {/* Logo con efecto */}
          <Link
            href="/"
            className="flex items-center group relative"
            aria-label="Ideas, LLC"
          >

            <Logo width={140} height={48} priority className="relative logo-bulb" />
          </Link>

          {/* Nav central pill */}
          <nav className="hidden lg:flex items-center">
            <div
              ref={navListRef}
              className="relative flex items-center gap-2 p-1.5 rounded-full liquid-glass-pill"
              onMouseLeave={handleNavLeave}
            >
              {links.map((l) => {
                const active = isActive(l.href, l.exact);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onMouseEnter={handleNavLinkHover}
                    className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                      active ? "text-[var(--color-ink-900)]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-[var(--color-brand-500)] shadow-[0_8px_20px_-8px_rgba(255,174,0,0.65)]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{l.label}</span>
                  </Link>
                );
              })}
              {/* Liquid glass hover lens */}
              <span ref={lensRef} className="nav-lens" />
            </div>
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-white/85 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition"
                >
                  <LogIn size={14} /> Entrar
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full border border-white/20 text-white/90 hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] transition"
                >
                  <UserPlus size={14} /> Registro
                </button>
              </>
            )}

            {/* Botón cotización con efecto magnético */}
            <Link
              href="/cotizacion"
              className="group relative inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-900)] font-black text-sm shadow-[0_10px_25px_-8px_rgba(255,174,0,0.5)] hover:shadow-[0_18px_40px_-12px_rgba(255,174,0,0.7)] hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <span className="absolute inset-0 bg-[var(--color-ink-900)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Sparkles size={14} className="relative group-hover:text-[var(--color-brand-500)] transition-colors" />
              <span className="relative group-hover:text-white transition-colors">Cotización</span>
              <ArrowRight size={14} className="relative group-hover:text-[var(--color-brand-500)] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Mobile button */}
          <button
            className="lg:hidden relative w-11 h-11 rounded-full grid place-items-center bg-white/10 backdrop-blur text-white transition-colors"
            aria-label="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative w-5 h-5">
              <span className={`absolute left-0 top-1.5 w-5 h-[2px] bg-current transition-all duration-300 ${open ? "rotate-45 top-2.5" : ""}`} />
              <span className={`absolute left-0 top-2.5 w-5 h-[2px] bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3.5 w-5 h-[2px] bg-current transition-all duration-300 ${open ? "-rotate-45 top-2.5" : ""}`} />
            </span>
          </button>
        </div>
      </header>
      </div>{/* end fixed wrapper */}

      {/* ───── MOBILE OVERLAY ───── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-0 z-30 bg-[var(--color-ink-900)]/98 backdrop-blur-xl pt-24 overflow-y-auto"
          >
            <div className="absolute inset-0 grid-bg-dark opacity-30 pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[var(--color-brand-500)]/20 blur-3xl pointer-events-none" />

            <div className="relative container-x py-6 flex flex-col gap-1">
              {links.map((l, i) => {
                const active = isActive(l.href, l.exact);
                return (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between py-5 border-b border-white/10 text-3xl font-black tracking-tight transition-colors ${
                        active ? "text-[var(--color-brand-500)]" : "text-white hover:text-[var(--color-brand-400)]"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className="text-xs font-mono text-white/30 tabular-nums">0{i + 1}</span>
                        {l.label}
                      </span>
                      <ArrowRight size={22} className={active ? "text-[var(--color-brand-500)]" : "text-white/30"} />
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="mt-8 flex flex-col gap-3"
              >
                {user ? (
                  <Link
                    href="/portal"
                    onClick={() => setOpen(false)}
                    className="btn btn-brand text-base justify-center"
                  >
                    <LayoutDashboard size={16} /> Mi portal <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setOpen(false); openAuth("login"); }}
                      className="btn btn-ghost-light justify-center"
                    >
                      <LogIn size={16} /> Entrar
                    </button>
                    <button
                      onClick={() => { setOpen(false); openAuth("register"); }}
                      className="btn btn-ghost-light justify-center"
                    >
                      <UserPlus size={16} /> Registro
                    </button>
                  </div>
                )}
                <Link
                  href="/cotizacion"
                  onClick={() => setOpen(false)}
                  className="btn btn-brand text-base justify-center"
                >
                  <Sparkles size={16} /> Cotización <ArrowRight size={16} />
                </Link>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost-light justify-center"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-10 pt-6 border-t border-white/10 grid gap-4 text-sm text-white/70"
              >
                <a href="tel:9393563399" className="flex items-center gap-3 hover:text-[var(--color-brand-400)]">
                  <span className="w-9 h-9 rounded-full bg-white/5 grid place-items-center text-[var(--color-brand-500)]"><Phone size={14} /></span>
                  939-356-3399
                </a>
                <a href="mailto:ventas@printingideaspr.com" className="flex items-center gap-3 hover:text-[var(--color-brand-400)]">
                  <span className="w-9 h-9 rounded-full bg-white/5 grid place-items-center text-[var(--color-brand-500)]"><Mail size={14} /></span>
                  ventas@printingideaspr.com
                </a>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-white/5 grid place-items-center text-[var(--color-brand-500)]"><MapPin size={14} /></span>
                  Industrial Park, Calle 272 Lot 3, Carolina, PR 00982
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <a href="https://www.facebook.com/ideasprllc/" className="w-9 h-9 rounded-full bg-white/5 grid place-items-center hover:bg-[var(--color-brand-500)] hover:text-[var(--color-ink-900)]"><Facebook size={14} /></a>
                    <a href="https://www.instagram.com/ideas_llc/" className="w-9 h-9 rounded-full bg-white/5 grid place-items-center hover:bg-[var(--color-brand-500)] hover:text-[var(--color-ink-900)]"><Instagram size={14} /></a>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


function UserMenu({ user }: { user: { name?: string | null; email?: string | null; role?: string } }) {
  const [openMenu, setOpenMenu] = useState(false);
  const initials = (user.name ?? user.email ?? "U")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = user.role === "admin" ? "Admin" : user.role === "employee" ? "Empleado" : "Cliente";
  return (
    <div className="relative">
      <button
        onClick={() => setOpenMenu((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-white/15 hover:border-[var(--color-brand-500)]/60 hover:bg-white/5 transition"
        aria-haspopup="menu"
        aria-expanded={openMenu}
      >
        <span className="w-8 h-8 rounded-full bg-[var(--color-brand-500)] grid place-items-center font-black text-[12px] text-[var(--color-ink-900)]">
          {initials}
        </span>
        <span className="text-xs font-bold text-white/85 max-w-[100px] truncate">{user.name ?? "Cuenta"}</span>
      </button>
      <AnimatePresence>
        {openMenu && (
          <>
            <button className="fixed inset-0 z-40" onClick={() => setOpenMenu(false)} aria-label="Cerrar menu" />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[var(--color-ink-950)]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-white/10">
                <div className="text-sm font-semibold truncate">{user.name ?? "Usuario"}</div>
                <div className="text-[11px] text-white/55 truncate">{user.email}</div>
                <div className="mt-1.5 inline-block text-[10px] uppercase tracking-widest font-bold text-[var(--color-brand-500)]">{roleLabel}</div>
              </div>
              <Link
                href="/portal"
                onClick={() => setOpenMenu(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 text-white/85"
              >
                <LayoutDashboard size={14} /> Mi portal
              </Link>
              <button
                onClick={() => { setOpenMenu(false); signOut({ callbackUrl: "/" }); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-red-500/10 text-red-400"
              >
                <X size={14} /> Cerrar sesion
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
