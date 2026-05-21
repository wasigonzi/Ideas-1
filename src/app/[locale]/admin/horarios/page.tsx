import { prisma } from "@/lib/prisma";
import { HorariosManager } from "@/components/portal/HorariosManager";

export const dynamic = "force-dynamic";

export default async function AdminHorariosPage() {
  const employees = await prisma.user.findMany({
    where: { active: true, role: { in: ["employee", "admin"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  const shifts = await prisma.shift.findMany({
    orderBy: [{ userId: "asc" }, { dayOfWeek: "asc" }, { start: "asc" }]
  });

  const since = new Date();
  since.setDate(since.getDate() - 14);
  const punches = await prisma.punch.findMany({
    where: { in: { gte: since } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      breaks: { orderBy: { start: "asc" } }
    },
    orderBy: { in: "desc" },
    take: 200
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Horarios y ponche</h1>
        <p className="text-white/65 mt-1">
          Asigna turnos semanales y revisa el registro de ponches.
        </p>
      </header>

      <HorariosManager
        employees={employees}
        shifts={shifts.map((s) => ({
          id: s.id,
          userId: s.userId,
          dayOfWeek: s.dayOfWeek,
          start: s.start,
          end: s.end,
          label: s.label,
          active: s.active
        }))}
        punches={punches.map((p) => ({
          id: p.id,
          userId: p.userId,
          userName: p.user.name ?? p.user.email,
          in: p.in.toISOString(),
          out: p.out ? p.out.toISOString() : null,
          hours: p.hours,
          note: p.note,
          source: p.source,
          breaks: p.breaks.map((b) => ({
            id: b.id,
            start: b.start.toISOString(),
            end: b.end ? b.end.toISOString() : null,
          }))
        }))}
      />
    </div>
  );
}
