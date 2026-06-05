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
  images: z.string().optional().nullable(), // JSON string[]
  variants: z.string().optional().nullable(), // JSON array
  priceFrom: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";

  const products = await prisma.storeProduct.findMany({
    where: all ? undefined : { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = ProductSchema.parse(body);
  const created = await prisma.storeProduct.create({ data });
  return NextResponse.json(created, { status: 201 });
}
