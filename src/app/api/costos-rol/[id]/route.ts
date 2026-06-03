import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const RoleRateSchema = z.object({
  role: z.string().min(1).max(120),
  hourlyCost: z.coerce.number().min(0),
  notes: z.string().max(2000).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const data = RoleRateSchema.parse(await req.json());
  const updated = await prisma.roleRate.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  await prisma.roleRate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
