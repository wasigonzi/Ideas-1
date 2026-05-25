import Link from "next/link";
import { FileText, Wrench, Image, Users, ArrowRight } from "lucide-react";

const PAGES = [
  {
    key: "inicio",
    label: "Inicio (Landing)",
    description: "Página principal del sitio. Edita el hero, estadísticas, servicios destacados, proyectos y CTA.",
    icon: FileText,
    href: "/admin/landing",
    color: "var(--color-brand-500)",
  },
  {
    key: "servicios",
    label: "Servicios",
    description: "Página pública de servicios. Agrega secciones personalizadas sobre el hero y el pie de la página.",
    icon: Wrench,
    href: "/admin/paginas/servicios",
    color: "#6366f1",
  },
  {
    key: "proyectos",
    label: "Proyectos",
    description: "Página pública de proyectos. Personaliza el encabezado y las secciones complementarias.",
    icon: Image,
    href: "/admin/paginas/proyectos",
    color: "#10b981",
  },
  {
    key: "nosotros",
    label: "Nosotros",
    description: "Página Sobre nosotros. Edita misión, visión, valores y cualquier bloque de contenido.",
    icon: Users,
    href: "/admin/paginas/nosotros",
    color: "#f59e0b",
  },
];

export default function PaginasPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="heading-lg">Editor de páginas</h1>
        <p className="text-white/50 text-sm mt-1">
          Selecciona una página para editarla con el constructor visual de bloques.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {PAGES.map(({ key, label, description, icon: Icon, href, color }) => (
          <Link
            key={key}
            href={href}
            className="group card p-6 flex flex-col gap-4 hover:border-white/20 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-10 h-10 rounded-xl grid place-items-center"
                style={{ background: `${color}20`, color }}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white group-hover:text-[var(--color-brand-400)] transition-colors">
                  {label}
                </div>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/30 group-hover:text-[var(--color-brand-400)] transition-colors ml-auto">
              Abrir editor <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
