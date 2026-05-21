import { ListChecks, User } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";

export default async function ClienteLayout({
  children, params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireRole(["admin", "client"], locale);

  const links = [
    { href: `/${locale}/cliente/tareas`, label: "Mis tareas", icon: ListChecks },
    { href: `/${locale}/cliente/perfil`, label: "Mi perfil", icon: User }
  ];

  return (
    <PortalShell title="Portal del cliente" user={user} links={links} locale={locale}>
      {children}
    </PortalShell>
  );
}
