import { buildPresidentDashboard } from "@/lib/intelligence";
import { GoalEditor } from "./GoalEditor";
import { TrendingUp, Target, AlertTriangle, CheckCircle2, DollarSign, Layers, Trophy, Package, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default async function InteligenciaPage() {
  const d = await buildPresidentDashboard();
  const maxStageCount = Math.max(1, ...d.stages.map((s) => s.count));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="heading-lg">Dashboard del Presidente</h1>
        <p className="text-white/55 text-sm mt-1 capitalize">{d.monthLabel}</p>
      </header>

      {/* Meta de ventas mensual */}
      <section className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[var(--color-brand-400)]" />
            <h2 className="font-semibold">Meta de ventas del mes</h2>
          </div>
          <div className="text-sm text-white/60">
            Meta: <strong className="text-white"><GoalEditor initial={d.monthlyGoal} /></strong>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-end justify-between mb-1">
            <span className="text-2xl font-bold">{money(d.monthSales)}</span>
            <span className="text-sm text-white/55">{d.goalProgress}% de la meta</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full ${d.goalProgress >= 100 ? "bg-emerald-500" : d.goalProgress >= 60 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(100, d.goalProgress)}%` }}
            />
          </div>
          <p className="text-xs text-white/45 mt-1">
            Faltan {money(Math.max(0, d.monthlyGoal - d.monthSales))} para alcanzar la meta.
          </p>
        </div>
      </section>

      {/* KPIs principales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Layers size={18} />} label="Proyectos activos" value={String(d.activeProjects)} accent="text-sky-400 bg-sky-500/15" />
        <Kpi icon={<CheckCircle2 size={18} />} label="Cerrados este mes" value={String(d.completedThisMonth)} accent="text-emerald-400 bg-emerald-500/15" />
        <Kpi icon={<DollarSign size={18} />} label="Margen estimado" value={money(d.totalMargin)} accent={d.totalMargin >= 0 ? "text-emerald-400 bg-emerald-500/15" : "text-red-400 bg-red-500/15"} hint={d.marginPct != null ? `${Math.round(d.marginPct * 100)}% sobre lo cotizado` : undefined} />
        <Kpi icon={<AlertTriangle size={18} />} label="Atrasados / por aprobar" value={`${d.overdueProjects} / ${d.pendingApprovals}`} accent="text-amber-400 bg-amber-500/15" />
      </div>

      {/* Costo vs facturación agregado */}
      <section className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18} /> Costo vs. facturación (proyectos activos)</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs uppercase text-white/50">Cotizado</div>
            <div className="text-xl font-bold">{money(d.totalQuoted)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-white/50">Costo real</div>
            <div className="text-xl font-bold">{money(d.totalCost)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-white/50">Margen</div>
            <div className={`text-xl font-bold ${d.totalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {money(d.totalMargin)}
            </div>
          </div>
        </div>
      </section>

      {/* Flujo de proyectos por etapa + cuellos de botella */}
      <section className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Layers size={18} /> Flujo por etapa</h2>
        <div className="space-y-3">
          {d.stages.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.accent ?? "bg-slate-500"}`} />
                  {s.label}
                  {s.bottleneck && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-300 bg-red-500/15 rounded-full px-2 py-0.5">
                      <AlertTriangle size={11} /> Cuello de botella
                    </span>
                  )}
                </span>
                <span className="text-white/55">
                  {s.count} proyecto{s.count === 1 ? "" : "s"}
                  {s.avgDaysInStage != null && ` · ${s.avgDaysInStage.toFixed(0)}d prom.`}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${s.bottleneck ? "bg-red-500" : "bg-[var(--color-brand-500,#3b82f6)]"}`}
                  style={{ width: `${(s.count / maxStageCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-3">
          El cuello de botella marca la etapa (no final) con mayor antigüedad promedio y 2+ proyectos estancados.
        </p>
      </section>

      {/* Metas por vendedor / colaborador */}
      <section className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Trophy size={18} /> Ventas por colaborador</h2>
        {d.sellers.length === 0 ? (
          <p className="text-sm text-white/50">Aún no hay proyectos con responsables asignados.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {d.sellers.map((s, i) => (
              <li key={s.userId} className="py-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center text-white/40 font-mono text-sm">{i + 1}</span>
                  <span className="truncate">{s.name ?? "—"}</span>
                  <span className="text-xs text-white/45">{s.projects} proyecto{s.projects === 1 ? "" : "s"}</span>
                </span>
                <span className="font-semibold">{money(s.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Mezcla de trabajos: meta 70% sin instalar / 30% con instalación */}
      <div className="grid sm:grid-cols-2 gap-4">
        <section className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Package size={18} /> Mezcla de trabajos
            <span className="text-xs text-white/40 font-normal ml-1">meta: 70% / 30%</span>
          </h2>
          {d.activeProjects === 0 ? (
            <p className="text-sm text-white/50">Sin proyectos activos.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Sin instalación (impreso)</span>
                  <span className="font-semibold">{d.installMix.noInstallPct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${d.installMix.noInstallPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-white/45 mt-1">
                  <span>{d.installMix.noInstall} proyectos</span>
                  <span>{money(d.installMix.noInstallValue)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-sky-300">Con instalación</span>
                  <span className="font-semibold">{d.installMix.withInstallPct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${d.installMix.withInstallPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-white/45 mt-1">
                  <span>{d.installMix.withInstall} proyectos</span>
                  <span>{money(d.installMix.withInstallValue)}</span>
                </div>
              </div>
              <p className="text-xs text-white/35 mt-2">
                Referencia: 70% sin instalar · 30% con instalación
              </p>
            </div>
          )}
        </section>

        {/* Capacidad del taller */}
        <section className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Wrench size={18} /> Capacidad del taller</h2>
          {d.capacityLoad.length === 0 ? (
            <p className="text-sm text-white/50">
              Sin procesos configurados.{" "}
              <a href="/admin/costos" className="text-[var(--color-brand-400)] hover:underline">Configura la capacidad.</a>
            </p>
          ) : (
            <div className="space-y-3">
              {d.capacityLoad.map((c) => (
                <div key={c.process}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.process}</span>
                    <span className="text-white/55 text-xs shrink-0 ml-2">{c.unitsPerDay} {c.unitLabel}/día</span>
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {c.activeProductionProjects} proyecto{c.activeProductionProjects === 1 ? "" : "s"} en producción ahora
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon, label, value, accent, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${accent}`}>{icon}</div>
      <div className="text-xs uppercase text-white/55 mt-3">{label}</div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
      {hint && <div className="text-xs text-white/45 mt-0.5">{hint}</div>}
    </div>
  );
}