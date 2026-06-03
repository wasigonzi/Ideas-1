import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const MoveSchema = z.object({
  toStage: z.string().min(1).max(40),
  note: z.string().max(2000).optional().nullable(),
  // Regla de oro: ninguna etapa avanza sin foto + checklist.
  photos: z.array(z.string().url()).min(1, "Se requiere al menos una foto de evidencia"),
  checklist: z
    .array(z.object({ text: z.string().min(1), done: z.boolean() }))
    .min(1, "Se requiere un checklist"),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const parsed = MoveSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { toStage, note, photos, checklist } = parsed.data;

  // Todos los items del checklist deben estar completados para avanzar.
  if (checklist.some((c) => !c.done)) {
    return NextResponse.json(
      { error: "checklist_incomplete", message: "Completa todos los items del checklist antes de avanzar." },
      { status: 400 },
    );
  }

  const project = await prisma.workProject.findUnique({ where: { id }, select: { stage: true } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [, updated] = await prisma.$transaction([
    prisma.workProjectStageEvent.create({
      data: {
        projectId: id,
        actorId: auth.id,
        fromStage: project.stage,
        toStage,
        note: note || null,
        photos: JSON.stringify(photos),
        checklist: JSON.stringify(checklist),
      },
    }),
    prisma.workProject.update({
      where: { id },
      data: {
        stage: toStage,
        ...(toStage === "closing" ? { completedAt: new Date() } : {}),
      },
    }),
  ]);

  await logAudit({
    actor: auth,
    action: "move",
    entity: "WorkProject",
    entityId: id,
    summary: `Movió el proyecto de "${project.stage}" a "${toStage}"`,
  });

  return NextResponse.json(updated);
}
