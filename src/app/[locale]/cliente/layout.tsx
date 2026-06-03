import { ListChecks, User, FolderKanban } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";

export default async function ClienteLayout({
  children,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const user = await requireRole(["client"]);

  const links = [
    { href: "/cliente/proyectos", label: "Mis proyectos", icon: FolderKanban },
    { href: "/cliente/tareas", label: "Mis tareas", icon: ListChecks },
    { href: "/cliente/perfil", label: "Mi perfil", icon: User }
  ];

  return (
    <PortalShell title="Portal del cliente" user={user} links={links}>
      {children}
    </PortalShell>
  );
}
