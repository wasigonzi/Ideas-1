/**
 * Registro de auditoría de acciones sensibles.
 *
 * Llama a `logAudit(...)` después de crear/editar/borrar/exportar registros
 * importantes. Es "best-effort": si falla el insert nunca rompe el flujo
 * principal (se traga el error y lo loguea en consola).
 */
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "export"
  | "approve"
  | "reject"
  | "move";

export type AuditActor = {
  id?: string;
  email?: string;
  role?: string;
};

export type AuditInput = {
  actor: AuditActor;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    let ip: string | undefined;
    try {
      ip = await getClientIp();
    } catch {
      ip = undefined;
    }
    await prisma.auditLog.create({
      data: {
        actorId: input.actor.id ?? null,
        actorEmail: input.actor.email ?? null,
        actorRole: input.actor.role ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] no se pudo registrar la acción:", err);
  }
}
