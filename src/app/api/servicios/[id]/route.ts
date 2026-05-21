import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ServiceSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  titleEs: z.string().min(2).max(120),
  titleEn: z.string().min(2).max(120),
  descEs: z.string().min(2).max(2000),
  descEn: z.string().min(2).max(2000),
  icon: z.string().max(60).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
  gallery: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true)
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const data = ServiceSchema.parse(await req.json());
  const updated = await prisma.service.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
