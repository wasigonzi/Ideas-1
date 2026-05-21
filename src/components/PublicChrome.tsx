"use client";

import { usePathname } from "next/navigation";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  // Hide the public navbar/footer inside portal areas so they feel app-like.
  const inPortal = /\/(admin|cliente|empleado)(\/|$)/.test(pathname);
  if (inPortal) return null;
  return <>{children}</>;
}
