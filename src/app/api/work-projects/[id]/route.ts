import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  estimateNumber: z.string().max(40).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  clientId: z.string().optional().nullable(),
  clientName: z.string().max(160).optional().nullable(),
  clientEmail: z.string().max(160).optional().nullable(),
  clientPhone: z.string().max(60).optional().nullable(),
  quoted: z.coerce.number().min(0).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  archived: z.coerce.boolean().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const project = await prisma.workProject.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      documents: { orderBy: { createdAt: "desc" } },
      stageEvents: { orderBy: { createdAt: "desc" } },
      tasks: { select: { id: true, title: true, status: true } },
      orders: { select: { id: true, number: true, total: true, paid: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const data = UpdateSchema.parse(await req.json());
  const updated = await prisma.workProject.update({ where: { id }, data });
  await logAudit({
    actor: auth,
    action: "update",
    entity: "WorkProject",
    entityId: id,
    summary: `Editó el proyecto ${updated.number} — ${updated.title}`,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const existing = await prisma.workProject.findUnique({ where: { id }, select: { number: true, title: true } });
  await prisma.workProject.delete({ where: { id } });
  await logAudit({
    actor: auth,
    action: "delete",
    entity: "WorkProject",
    entityId: id,
    summary: existing ? `Borró el proyecto ${existing.number} — ${existing.title}` : `Borró el proyecto ${id}`,
  });
  return NextResponse.json({ ok: true });
}
