import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
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

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.material.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const data = MaterialSchema.parse(await req.json());
  const created = await prisma.material.create({ data });
  return NextResponse.json(created);
}
