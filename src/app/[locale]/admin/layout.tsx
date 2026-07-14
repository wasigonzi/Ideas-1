import { LayoutDashboard, FileText, Wrench, Image as ImageIcon, Users, ClipboardList, Receipt, Clock, NotebookPen, Settings, MessageSquareText, LayoutGrid, Layers, DollarSign, FolderKanban, CalendarOff, Calculator, LineChart, ShieldCheck, Briefcase, Timer, ShoppingBag, Package, UserCog } from "lucide-react";
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
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, iconName: "LayoutDashboard", category: "General" },
    { href: "/admin/inteligencia", label: "Inteligencia", icon: LineChart, iconName: "LineChart", category: "General" },
    { href: "/admin/chat", label: "Chat", icon: MessageSquareText, iconName: "MessageSquareText", category: "General" },
    { href: "/admin/instrucciones", label: "Instrucciones", icon: NotebookPen, iconName: "NotebookPen", category: "General" },

    { href: "/admin/tareas", label: "Tareas", icon: ClipboardList, iconName: "ClipboardList", category: "Taller y Producción" },
    { href: "/admin/inventario", label: "Inventario", icon: Package, iconName: "Package", category: "Taller y Producción" },
    { href: "/admin/materiales", label: "Materiales", icon: Layers, iconName: "Layers", category: "Taller y Producción" },
    { href: "/admin/costos", label: "Costos y capacidad", icon: DollarSign, iconName: "DollarSign", category: "Taller y Producción" },

    { href: "/admin/cotizaciones", label: "Cotizaciones", icon: FileText, iconName: "FileText", category: "Ventas y Facturas" },
    { href: "/admin/ordenes", label: "Órdenes", icon: Briefcase, iconName: "Briefcase", category: "Ventas y Facturas" },
    { href: "/admin/facturas", label: "Facturas", icon: Receipt, iconName: "Receipt", category: "Ventas y Facturas" },
    { href: "/admin/calculadora", label: "Calculadora", icon: Calculator, iconName: "Calculator", category: "Ventas y Facturas" },

    { href: "/admin/horas", label: "Horas y Ponche", icon: Timer, iconName: "Timer", category: "Equipo y Horarios" },
    { href: "/admin/horarios", label: "Horarios", icon: Clock, iconName: "Clock", category: "Equipo y Horarios" },
    { href: "/admin/dias-libres", label: "Días libres", icon: CalendarOff, iconName: "CalendarOff", category: "Equipo y Horarios" },

    { href: "/admin/servicios", label: "Portafolio Web", icon: Wrench, iconName: "Wrench", category: "Sitio Web y Tienda" },
    { href: "/admin/proyectos", label: "Proyectos Web", icon: ImageIcon, iconName: "Image", category: "Sitio Web y Tienda" },
    { href: "/admin/tienda", label: "Tienda", icon: ShoppingBag, iconName: "ShoppingBag", category: "Sitio Web y Tienda" },
    { href: "/admin/paginas", label: "Páginas", icon: LayoutGrid, iconName: "LayoutGrid", category: "Sitio Web y Tienda" },

    { href: "/admin/usuarios", label: "Usuarios", icon: Users, iconName: "Users", category: "Configuración y Seguridad" },
    { href: "/admin/auditoria", label: "Auditoría", icon: ShieldCheck, iconName: "ShieldCheck", category: "Configuración y Seguridad" },
    { href: "/admin/settings", label: "Configuración", icon: Settings, iconName: "Settings", category: "Configuración y Seguridad" },
    { href: "/admin/perfil", label: "Mi perfil", icon: UserCog, iconName: "UserCog", category: "Configuración y Seguridad" }
  ];

  return (
    <PortalShell title="Administración" user={user} links={links} badges={badges}>
      {children}
    </PortalShell>
  );
}
