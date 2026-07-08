import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth-helpers";
import type { ProjectStageDTO } from "@/lib/project-stages";

export type StageMoveResult =
  | { ok: true }
  | { ok: false; status: number; error: string; message: string };

export function validateProjectStageMove(input: {
  fromStage: string;
  toStage: string;
  role: Role;
  stages: ProjectStageDTO[];
}): StageMoveResult {
  const { fromStage, toStage, role, stages } = input;
  const fromIndex = stages.findIndex((stage) => stage.key === fromStage);
  const toIndex = stages.findIndex((stage) => stage.key === toStage);

  if (toIndex === -1) {
    return {
      ok: false,
      status: 400,
      error: "invalid_stage",
      message: "La etapa solicitada no existe en el flujo configurado.",
    };
  }

  if (fromStage === toStage) {
    return {
      ok: false,
      status: 400,
      error: "same_stage",
      message: "El proyecto ya está en esa etapa.",
    };
  }

  if (role === "admin") return { ok: true };

  if (toStage === "closing") {
    return {
      ok: false,
      status: 403,
      error: "admin_required",
      message: "Solo un administrador puede cerrar un proyecto.",
    };
  }

  if (fromIndex === -1 || toIndex !== fromIndex + 1) {
    return {
      ok: false,
      status: 403,
      error: "invalid_transition",
      message: "Los empleados solo pueden avanzar el proyecto a la próxima etapa.",
    };
  }

  return { ok: true };
}

export type TaskCompletionSnapshot = {
  title: string;
  attachments: string | null;
  coverImage: string | null;
  workProjectId: string | null;
};

export function safeStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function enforceTaskCompletionRules(
  taskId: string,
  task: TaskCompletionSnapshot,
): Promise<NextResponse | null> {
  const items = await prisma.taskChecklistItem.findMany({
    where: { taskId },
    select: { done: true },
  });
  if (items.length > 0 && items.some((item) => !item.done)) {
    const pending = items.filter((item) => !item.done).length;
    return NextResponse.json(
      {
        error: "checklist_incomplete",
        message: `No puedes completar la tarea: faltan ${pending} elemento(s) del checklist.`,
      },
      { status: 400 },
    );
  }

  const attachmentCount = await prisma.taskAttachment.count({ where: { taskId } });
  const hasEvidence =
    attachmentCount > 0 ||
    safeStringArray(task.attachments).length > 0 ||
    Boolean(task.coverImage);
  if (!hasEvidence) {
    return NextResponse.json(
      {
        error: "evidence_required",
        message: "No puedes completar la tarea: adjunta al menos una foto de evidencia.",
      },
      { status: 400 },
    );
  }

  if (task.workProjectId) {
    const isApprovalTask = /arte|diseño|aprobación|propuesta|approval|mockup/i.test(task.title);
    if (isApprovalTask) {
      const approval = await prisma.approvalSheet.findUnique({
        where: { taskId },
        select: { status: true },
      });
      if (!approval || approval.status !== "approved") {
        return NextResponse.json(
          {
            error: "approval_required",
            message:
              "No puedes completar la tarea: el cliente debe aprobar la hoja de aprobación primero.",
          },
          { status: 400 },
        );
      }
    }
  }

  return null;
}
