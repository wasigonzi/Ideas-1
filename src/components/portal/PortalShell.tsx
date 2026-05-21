import Link from "next/link";
import { signOut } from "@/auth";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { MobileBottomNav } from "./MobileBottomNav";

// Re-export pure UI pieces so existing imports keep working.
export { StatCard, StatusPill, PriorityPill, ProgressBar } from "./ui";

export type PortalLink = { href: string; label: string; icon: LucideIcon };

export function PortalShell({
  title,
  user,
  links,
  locale,
  children,
  badges
}: {
  title: string;
  user: { name?: string | null; email?: string | null; role?: string };
  links: PortalLink[];
  locale: string;
  children: React.ReactNode;
  badges?: Record<string, number>;
}) {
  const initials = (user.name ?? user.email ?? "U")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="lg:container-x lg:py-10 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 min-h-[80vh]">
      {/* ────────── MOBILE APP BAR ────────── */}
      <header className="app-bar lg:hidden flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[var(--color-brand-500)] grid place-items-center font-black text-[12px] text-[var(--color-ink-950)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-brand-400)] leading-none">{title}</div>
            <div className="text-sm font-bold truncate leading-tight">{user.name ?? "Usuario"}</div>
          </div>
        </div>
        <Link
          href={`/${locale}`}
          className="text-[11px] font-bold text-white/60 hover:text-white px-3 py-2 rounded-full hover:bg-white/5"
        >
          Salir al sitio
        </Link>
      </header>

      {/* ────────── DESKTOP SIDEBAR ────────── */}
      <aside className="card p-5 h-fit sticky top-24 hidden lg:block">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-11 h-11 rounded-full bg-[var(--color-brand-500)] grid place-items-center font-bold text-[var(--color-ink-950)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{user.name ?? "Usuario"}</div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-400)]">{title}</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-4">
          {links.map((l) => {
            const Icon = l.icon;
            const badge = badges?.[l.href];
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-white transition"
              >
                <Icon size={16} className="text-white/60" /> {l.label}
                {badge != null && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: `/${locale}` });
            }}
          >
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 text-red-400 mt-4">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </form>
        </nav>

        <div className="text-[11px] text-white/45 px-3 mt-5 break-all border-t border-white/10 pt-4">
          {user.email}
        </div>
      </aside>

      {/* ────────── CONTENT ────────── */}
      <div className="min-w-0 px-4 sm:px-5 lg:px-0 py-6 lg:py-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>

      {/* ────────── MOBILE BOTTOM TABS ────────── */}
      <MobileBottomNav
        items={links.map((l) => ({
          href: l.href,
          label: l.label,
          iconName:
            (l.icon as unknown as { displayName?: string; name?: string }).displayName ??
            (l.icon as unknown as { name?: string }).name ??
            "Circle"
        }))}
        locale={locale}
      />
    </div>
  );
}
