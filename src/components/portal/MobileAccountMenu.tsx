"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { UserCog, LogOut, X } from "lucide-react";

export function MobileAccountMenu({
  initials,
  name,
  email,
  profileHref
}: {
  initials: string;
  name: string;
  email?: string | null;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full bg-[var(--color-brand-500)] grid place-items-center font-black text-[12px] text-[var(--color-ink-950)] shrink-0"
        aria-label="Cuenta"
      >
        {initials}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-0 rounded-b-3xl border-b border-white/10 bg-[var(--color-ink-950)]/95 backdrop-blur-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{name}</div>
                {email && <div className="text-xs text-white/45 truncate">{email}</div>}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 grid place-items-center rounded-full bg-white/10 text-white/80 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {profileHref && (
                <Link
                  href={profileHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-white/85"
                >
                  <UserCog size={16} className="text-[var(--color-brand-500)]" />
                  Mi perfil
                </Link>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-sm font-bold text-red-400"
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
