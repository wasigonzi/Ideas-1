import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  create: "Creó",
  update: "Editó",
  delete: "Borró",
  login: "Inició sesión",
  export: "Exportó",
  approve: "Aprobó",
  reject: "Rechazó",
  move: "Movió",
};

const ACTION_ACCENT: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/15",
  update: "text-sky-400 bg-sky-500/15",
  delete: "text-red-400 bg-red-500/15",
  login: "text-white/60 bg-white/10",
  export: "text-violet-400 bg-violet-500/15",
  approve: "text-emerald-400 bg-emerald-500/15",
  reject: "text-red-400 bg-red-500/15",
  move: "text-amber-400 bg-amber-500/15",
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("es-PR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Puerto_Rico",
  }).format(d);

export default async function AuditoriaPage() {
  await requireRole(["admin"]);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg flex items-center gap-2">
          <ShieldCheck size={22} className="text-[var(--color-brand-400)]" />
          Auditoría
        </h1>
        <p className="text-white/55 text-sm mt-1">
          Registro de acciones sensibles (últimas 200). Quién hizo qué y cuándo.
        </p>
      </header>

      {logs.length === 0 ? (
        <div className="card p-10 text-center text-white/55">
          Aún no hay acciones registradas.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Entidad</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 whitespace-nowrap text-white/60">{fmt(log.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-white/85">{log.actor?.name ?? log.actorEmail ?? "—"}</div>
                      {log.actorRole && <div className="text-xs text-white/40">{log.actorRole}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_ACCENT[log.action] ?? "text-white/60 bg-white/10"}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/60">{log.entity}</td>
                    <td className="px-4 py-3 text-white/75">{log.summary ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
