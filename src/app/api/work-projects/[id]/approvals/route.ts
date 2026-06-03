import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// GET → aprobaciones de un proyecto (admin/empleado).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const approvals = await prisma.workProjectApproval.findMany({
    where: { projectId: id },
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(
    approvals.map((a) => ({
      ...a,
      files: a.files ? (JSON.parse(a.files) as string[]) : [],
    })),
  );
}

const CreateSchema = z.object({
  type: z.enum(["design", "quote"]).default("design"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  files: z.array(z.string().url()).optional().default([]),
});

// POST → admin solicita una aprobación al cliente del proyecto.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const project = await prisma.workProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const data = CreateSchema.parse(await req.json());
  const created = await prisma.workProjectApproval.create({
    data: {
      projectId: id,
      clientId: project.clientId,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      files: data.files.length ? JSON.stringify(data.files) : null,
    },
  });
  await logAudit({
    actor: auth,
    action: "create",
    entity: "WorkProjectApproval",
    entityId: created.id,
    summary: `Solicitó aprobación al cliente: "${data.title}"`,
  });
  return NextResponse.json(created);
}
