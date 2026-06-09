"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 text-red-400 mt-4"
    >
      <LogOut size={16} /> Cerrar sesion
    </button>
  );
}
