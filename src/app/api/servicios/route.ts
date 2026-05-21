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

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const data = ServiceSchema.parse(await req.json());
  const created = await prisma.service.create({ data });
  return NextResponse.json(created);
}
