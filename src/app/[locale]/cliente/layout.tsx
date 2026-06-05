import { ListChecks, User, FolderKanban, ClipboardList, Receipt, MessageSquareText, Calculator } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";

export default async function ClienteLayout({
  children,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const user = await requireRole(["client"]);

  const links = [
    { href: "/cliente/proyectos", label: "Mis proyectos", icon: FolderKanban },
    { href: "/cliente/cotizar", label: "Cotizar trabajo", icon: Calculator },
    { href: "/cliente/tareas", label: "Mis tareas", icon: ListChecks },
    { href: "/cliente/ordenes", label: "Órdenes", icon: ClipboardList },
    { href: "/cliente/facturas", label: "Facturas", icon: Receipt },
    { href: "/cliente/mensajes", label: "Mensajes", icon: MessageSquareText },
    { href: "/cliente/perfil", label: "Mi perfil", icon: User }
  ];

  return (
    <PortalShell title="Portal del cliente" user={user} links={links}>
      {children}
    </PortalShell>
  );
}
