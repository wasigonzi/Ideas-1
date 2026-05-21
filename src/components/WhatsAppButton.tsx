"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function WhatsAppButton({ whatsapp = "19393264007" }: { whatsapp?: string }) {
  const pathname = usePathname() ?? "";
  // Pages with a mobile bottom-nav: lift the WA button so they don't overlap on mobile.
  const isPortal = /\/(admin|cliente|empleado|portal)(\/|$)/.test(pathname);
  const liftMobile = isPortal ? "bottom-[calc(5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1.25rem+env(safe-area-inset-bottom))]";
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className={`fixed right-4 sm:right-5 z-40 group ${liftMobile} lg:bottom-5`}
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 blur-xl glow-pulse" />
      <span className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-2xl transition-transform group-hover:scale-110 active:scale-95">
        <MessageCircle size={24} fill="white" strokeWidth={1.5} />
      </span>
    </a>
  );
}
