import { LayoutDashboard, ListChecks, Calendar, Fingerprint, MessageSquareText } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";

export default async function EmpleadoLayout({
  children, params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireRole(["employee"], locale);

  const links = [
    { href: `/${locale}/empleado`, label: "Panel", icon: LayoutDashboard },
    { href: `/${locale}/empleado/ponche`, label: "Ponche", icon: Fingerprint },
    { href: `/${locale}/empleado/tareas`, label: "Mis tareas", icon: ListChecks },
    { href: `/${locale}/empleado/chat`, label: "Chat", icon: MessageSquareText },
    { href: `/${locale}/empleado/horario`, label: "Horario", icon: Calendar }
  ];

  return (
    <PortalShell title="Portal de empleado" user={user} links={links} locale={locale}>
      {children}
    </PortalShell>
  );
}
