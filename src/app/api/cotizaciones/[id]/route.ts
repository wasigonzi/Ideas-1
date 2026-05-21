import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z.object({
  status: z.enum(["new", "reviewed", "quoted", "won", "lost"]).optional(),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(160).optional(),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(160).optional().nullable(),
  service: z.string().max(120).optional().nullable(),
  budget: z.string().max(80).optional().nullable(),
  deadline: z.string().max(80).optional().nullable(),
  message: z.string().min(1).max(4000).optional()
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const data = PatchSchema.parse(await req.json());
  const updated = await prisma.quote.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
