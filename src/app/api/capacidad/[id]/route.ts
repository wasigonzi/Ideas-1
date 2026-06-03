import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const CapacitySchema = z.object({
  process: z.string().min(1).max(120),
  unitsPerDay: z.coerce.number().int().min(0),
  unitLabel: z.string().max(40).default("unidades"),
  notes: z.string().max(2000).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const data = CapacitySchema.parse(await req.json());
  const updated = await prisma.shopCapacity.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  await prisma.shopCapacity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
