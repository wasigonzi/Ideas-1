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

// ── Checklist automático por columna (PROP-OPS-001) ─────────────────────────
//
// Cada TaskColumn puede tener una plantilla de checklist (ColumnChecklistTemplate).
// Cuando una tarjeta entra a esa columna (creación o movimiento), copiamos los
// items pendientes a TaskChecklistItem, marcados con su templateItemId de origen
// para poder aplicar el "gate" por columna más abajo.

// Copies any template items for `columnKey` that this task doesn't already
// have (idempotent — safe to call every time a card re-enters a column).
// Returns the number of items actually created.
export async function copyColumnChecklistTemplates(
  taskId: string,
  columnKey: string,
): Promise<number> {
  const column = await prisma.taskColumn.findUnique({
    where: { key: columnKey },
    include: { checklistTemplates: { orderBy: { itemOrder: "asc" } } },
  });
  if (!column || column.checklistTemplates.length === 0) return 0;

  const existing = await prisma.taskChecklistItem.findMany({
    where: {
      taskId,
      templateItemId: { in: column.checklistTemplates.map((t) => t.id) },
    },
    select: { templateItemId: true },
  });
  const existingIds = new Set(existing.map((e) => e.templateItemId));
  const toCreate = column.checklistTemplates.filter((t) => !existingIds.has(t.id));
  if (toCreate.length === 0) return 0;

  const last = await prisma.taskChecklistItem.findFirst({
    where: { taskId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let pos = last?.position ?? 0;
  await prisma.taskChecklistItem.createMany({
    data: toCreate.map((t) => {
      pos += 10;
      return { taskId, text: t.itemText, templateItemId: t.id, position: pos };
    }),
  });
  return toCreate.length;
}

// Hard gate: a card may not leave `fromColumnKey` while any auto-generated
// checklist item for that column is still incomplete. Columns without a
// template (e.g. the legacy "Sin Clasificar" bucket) never gate.
export async function enforceColumnChecklistGate(
  taskId: string,
  fromColumnKey: string,
): Promise<NextResponse | null> {
  const column = await prisma.taskColumn.findUnique({
    where: { key: fromColumnKey },
    include: { checklistTemplates: { select: { id: true } } },
  });
  if (!column || column.checklistTemplates.length === 0) return null;

  const templateIds = column.checklistTemplates.map((t) => t.id);
  const pending = await prisma.taskChecklistItem.count({
    where: { taskId, templateItemId: { in: templateIds }, done: false },
  });
  if (pending > 0) {
    return NextResponse.json(
      {
        error: "column_checklist_incomplete",
        message: `No puedes avanzar de columna: faltan ${pending} elemento(s) del checklist de "${column.label}".`,
      },
      { status: 400 },
    );
  }
  return null;
}

// ── Responsable por columna (PROP-OPS-001) ──────────────────────────────────
//
// Resolves the default owner(s) configured for a column. The first owner
// (by creation order) becomes the "primary" assignee (Task.assigneeId), and
// the full set rides along in Task.members — same convention TaskEditor's
// MembersPicker already uses for multi-assignment.
export async function resolveColumnOwners(
  columnKey: string,
): Promise<{ assigneeId: string | null; memberIds: string[] }> {
  const column = await prisma.taskColumn.findUnique({
    where: { key: columnKey },
    include: { owners: { orderBy: { createdAt: "asc" } } },
  });
  if (!column || column.owners.length === 0) return { assigneeId: null, memberIds: [] };
  const memberIds = column.owners.map((o) => o.userId);
  return { assigneeId: memberIds[0], memberIds };
}
