import { LayoutDashboard, FileText, Wrench, Image as ImageIcon, Users, ClipboardList, Receipt, Clock, NotebookPen, Settings, MessageSquareText, LayoutGrid } from "lucide-react";
import { unstable_cache } from "next/cache";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const getAdminBadges = unstable_cache(
  async () => {
    try {
      const [overdueCount, urgentCount] = await Promise.all([
        prisma.invoice.count({ where: { status: "overdue" } }),
        prisma.task.count({ where: { priority: "urgent", status: { not: "done" } } }),
      ]);
      return { overdueCount, urgentCount };
    } catch {
      return { overdueCount: 0, urgentCount: 0 };
    }
  },
  ["admin-sidebar-badges"],
  { revalidate: 30, tags: ["admin-badges"] },
);

export default async function AdminLayout({
  children,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const user = await requireRole(["admin"]);

  const { overdueCount, urgentCount } = await getAdminBadges();
  const badges: Record<string, number> = {};
  if (overdueCount > 0) badges["/admin/facturas"] = overdueCount;
  if (urgentCount > 0) badges["/admin/tareas"] = urgentCount;

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/cotizaciones", label: "Cotizaciones", icon: FileText },
    { href: "/admin/tareas", label: "Tareas", icon: ClipboardList },
    { href: "/admin/chat", label: "Chat", icon: MessageSquareText },
    { href: "/admin/facturas", label: "Facturas", icon: Receipt },
    { href: "/admin/horarios", label: "Horarios", icon: Clock },
    { href: "/admin/instrucciones", label: "Instrucciones", icon: NotebookPen },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/servicios", label: "Servicios", icon: Wrench },
    { href: "/admin/proyectos", label: "Proyectos", icon: ImageIcon },
    { href: "/admin/paginas", label: "Páginas", icon: LayoutGrid },
    { href: "/admin/settings", label: "Configuración", icon: Settings }
  ];

  return (
    <PortalShell title="Administración" user={user} links={links} badges={badges}>
      {children}
    </PortalShell>
  );
}
