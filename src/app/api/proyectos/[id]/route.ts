import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const ProjectSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  titleEs: z.string().min(2).max(120),
  titleEn: z.string().min(2).max(120),
  descEs: z.string().min(2).max(4000),
  descEn: z.string().min(2).max(4000),
  category: z.string().max(60).optional().nullable(),
  cover: z.string().max(500).optional().nullable(),
  images: z.string().max(8000).optional().nullable(),
  featured: z.coerce.boolean().default(false)
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const data = ProjectSchema.parse(await req.json());
  const updated = await prisma.project.update({ where: { id }, data });
  revalidateTag("home");
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.project.delete({ where: { id } });
  revalidateTag("home");
  return NextResponse.json({ ok: true });
}
