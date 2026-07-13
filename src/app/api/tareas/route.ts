import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { resolveColumnOwners, copyColumnChecklistTemplates } from "@/lib/workflow";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const status = body.status ?? "todo";

  // If no explicit position provided, append to the end of the target column.
  let position = body.position !== undefined ? Number(body.position) : null;
  if (position === null) {
    const last = await prisma.task.findFirst({
      where: { status },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    position = (last?.position ?? 0) + 1000;
  }

  // Responsable por columna: si la columna de entrada tiene responsables por
  // defecto, se asignan de una vez (reemplazando cualquier valor enviado).
  const owners = await resolveColumnOwners(status);
  const assigneeId = owners.assigneeId ?? body.assigneeId ?? null;
  const members = owners.assigneeId
    ? JSON.stringify(owners.memberIds)
    : (Array.isArray(body.members)
        ? JSON.stringify(body.members.filter((x: unknown) => typeof x === "string"))
        : (typeof body.members === "string" && body.members) || null);

  const task = await prisma.task.create({
    data: {
      title: String(body.title ?? "Nueva tarea"),
      description: body.description ?? null,
      status,
      priority: body.priority ?? "normal",
      assigneeId,
      hours: Number(body.hours ?? 0),
      position,
      coverImage: body.coverImage || null,
      attachments: Array.isArray(body.attachments)
        ? JSON.stringify(body.attachments)
        : (typeof body.attachments === "string" && body.attachments) || null,
      members,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      orderId: body.orderId || null
    }
  });

  // Checklist automático por columna: copiar la plantilla de la columna de entrada.
  await copyColumnChecklistTemplates(task.id, status);

  return NextResponse.json(task, { status: 201 });
}
