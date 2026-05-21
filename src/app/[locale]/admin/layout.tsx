import { LayoutDashboard, FileText, Wrench, Image as ImageIcon, Users, ClipboardList, Receipt, Clock, NotebookPen, Settings, MessageSquareText, Globe } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children, params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireRole(["admin"], locale);

  const [overdueCount, urgentCount] = await Promise.all([
    prisma.invoice.count({ where: { status: "overdue" } }),
    prisma.task.count({ where: { priority: "urgent", status: { not: "done" } } })
  ]);
  const badges: Record<string, number> = {};
  if (overdueCount > 0) badges[`/${locale}/admin/facturas`] = overdueCount;
  if (urgentCount > 0) badges[`/${locale}/admin/tareas`] = urgentCount;

  const links = [
    { href: `/${locale}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${locale}/admin/cotizaciones`, label: "Cotizaciones", icon: FileText },
    { href: `/${locale}/admin/tareas`, label: "Tareas", icon: ClipboardList },
    { href: `/${locale}/admin/chat`, label: "Chat", icon: MessageSquareText },
    { href: `/${locale}/admin/facturas`, label: "Facturas", icon: Receipt },
    { href: `/${locale}/admin/horarios`, label: "Horarios", icon: Clock },
    { href: `/${locale}/admin/instrucciones`, label: "Instrucciones", icon: NotebookPen },
    { href: `/${locale}/admin/usuarios`, label: "Usuarios", icon: Users },
    { href: `/${locale}/admin/servicios`, label: "Servicios", icon: Wrench },
    { href: `/${locale}/admin/proyectos`, label: "Proyectos", icon: ImageIcon },
    { href: `/${locale}/admin/landing`, label: "Landing", icon: Globe },
    { href: `/${locale}/admin/settings`, label: "Configuración", icon: Settings }
  ];

  return (
    <PortalShell title="Administración" user={user} links={links} locale={locale} badges={badges}>
      {children}
    </PortalShell>
  );
}
