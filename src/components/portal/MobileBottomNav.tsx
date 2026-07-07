"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MoreHorizontal, X, LogOut, Circle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

export type NavItem = { href: string; label: string; iconName: string; category?: string };

function resolveIcon(name: string): LucideIcon {
  const map = LucideIcons as unknown as Record<string, LucideIcon>;
  return map[name] ?? Circle;
}

export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() ?? "";
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = items.slice(0, 4);
  const overflow = items.slice(4);
  const hasMore = overflow.length > 0;

  // Group overflow items by category, maintaining order
  const groupedOverflow: { category: string | null; items: NavItem[] }[] = [];
  overflow.forEach((item) => {
    const cat = item.category ?? null;
    let group = groupedOverflow.find((g) => g.category === cat);
    if (!group) {
      group = { category: cat, items: [] };
      groupedOverflow.push(group);
    }
    group.items.push(item);
  });

  const isActive = (href: string) => {
    if (pathname === href) return true;
    const parts = href.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return pathname.endsWith("/" + last);
  };

  return (
    <>
      <nav className="bottom-tabs lg:hidden" aria-label="Navegación">
        <ul className="flex items-stretch justify-around px-1">
          {primary.map((l) => {
            const Icon = resolveIcon(l.iconName);
            const active = isActive(l.href);
            return (
              <li key={l.href} className="flex-1">
                <Link
                  href={l.href}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2 min-h-14 text-[10px] font-bold tracking-wide transition ${
                    active ? "text-[var(--color-brand-500)]" : "text-white/65 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-tab-indicator"
                      className="absolute -top-px left-1/4 right-1/4 h-[3px] rounded-b-full bg-[var(--color-brand-500)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={20} />
                  <span className="leading-none truncate max-w-[72px]">{l.label}</span>
                </Link>
              </li>
            );
          })}
          {hasMore && (
            <li className="flex-1">
              <button
                onClick={() => setMoreOpen(true)}
                className="w-full flex flex-col items-center justify-center gap-1 py-2 min-h-14 text-[10px] font-bold tracking-wide text-white/65 hover:text-white"
              >
                <MoreHorizontal size={20} />
                <span>Más</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl border-t border-white/10 bg-[var(--color-ink-950)]/95 backdrop-blur-2xl pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] px-4 flex flex-col max-h-[85vh]"
          >
            <div className="mx-auto w-12 h-1.5 rounded-full bg-white/15 mb-4 shrink-0" />
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/55">Más opciones</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-9 h-9 grid place-items-center rounded-full bg-white/10 text-white/80"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 my-2 flex-1 custom-scrollbar">
              {groupedOverflow.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  {group.category && (
                    <h4 className="text-[10px] font-black text-white/35 uppercase tracking-widest px-1 pt-1">
                      {group.category}
                    </h4>
                  )}
                  <ul className="grid grid-cols-2 gap-2">
                    {group.items.map((l) => {
                      const Icon = resolveIcon(l.iconName);
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/85"
                          >
                            <Icon size={15} className="text-[var(--color-brand-500)] shrink-0" />
                            <span className="truncate">{l.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-xs font-bold text-red-400"
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
