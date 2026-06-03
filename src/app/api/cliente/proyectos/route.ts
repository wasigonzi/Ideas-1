import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { loadProjectStages } from "@/lib/project-stages";

// GET → proyectos del cliente autenticado con su etapa y progreso.
export async function GET() {
  const auth = await requireApiRole(["client"]);
  if (auth instanceof NextResponse) return auth;

  const [stages, projects] = await Promise.all([
    loadProjectStages(),
    prisma.workProject.findMany({
      where: { clientId: auth.id, archived: false },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        approvals: {
          where: { status: "pending" },
          select: { id: true },
        },
        _count: { select: { tasks: true } },
      },
    }),
  ]);

  const stageIndex = new Map(stages.map((s, i) => [s.key, i]));
  const total = stages.length;

  const data = projects.map((p) => {
    const idx = stageIndex.get(p.stage) ?? 0;
    const stage = stages[idx] ?? stages[0];
    return {
      id: p.id,
      number: p.number,
      title: p.title,
      stage: p.stage,
      stageLabel: stage?.label ?? p.stage,
      stageAccent: stage?.accent ?? null,
      progress: total > 0 ? Math.round(((idx + 1) / total) * 100) : 0,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      quoted: p.quoted,
      pendingApprovals: p.approvals.length,
      tasks: p._count.tasks,
    };
  });

  return NextResponse.json({ stages, projects: data });
}
