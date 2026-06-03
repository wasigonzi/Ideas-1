import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const MaterialSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  thickness: z.string().max(40).optional().nullable(),
  costPerSqFt: z.coerce.number().min(0),
  unit: z.string().max(20).default("ft2"),
  notes: z.string().max(2000).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const data = MaterialSchema.parse(await req.json());
  const updated = await prisma.material.update({ where: { id }, data });
  await logAudit({
    actor: auth,
    action: "update",
    entity: "Material",
    entityId: id,
    summary: `Editó el material ${updated.name} ($${updated.costPerSqFt}/ft²)`,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const existing = await prisma.material.findUnique({ where: { id }, select: { name: true } });
  await prisma.material.delete({ where: { id } });
  await logAudit({
    actor: auth,
    action: "delete",
    entity: "Material",
    entityId: id,
    summary: existing ? `Borró el material ${existing.name}` : `Borró el material ${id}`,
  });
  return NextResponse.json({ ok: true });
}
