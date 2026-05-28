import { LayoutDashboard, ListChecks, Calendar, Fingerprint, MessageSquareText, FileCheck } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";

export default async function EmpleadoLayout({
  children,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const user = await requireRole(["employee"]);

  const links = [
    { href: "/empleado", label: "Panel", icon: LayoutDashboard },
    { href: "/empleado/ponche", label: "Ponche", icon: Fingerprint },
    { href: "/empleado/tareas", label: "Mis tareas", icon: ListChecks },
    { href: "/empleado/chat", label: "Chat", icon: MessageSquareText },
    { href: "/empleado/hojas", label: "Hojas", icon: FileCheck },
    { href: "/empleado/horario", label: "Horario", icon: Calendar }
  ];

  return (
    <PortalShell title="Portal de empleado" user={user} links={links}>
      {children}
    </PortalShell>
  );
}
