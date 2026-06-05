import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ProductSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  image: z.string().max(600).optional().nullable(),
  images: z.string().optional().nullable(),
  variants: z.string().optional().nullable(),
  priceFrom: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = await prisma.storeProduct.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const data = ProductSchema.parse(await req.json());
  const updated = await prisma.storeProduct.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  await prisma.storeProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
