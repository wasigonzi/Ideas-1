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

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.shopCapacity.findMany({ orderBy: { process: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const data = CapacitySchema.parse(await req.json());
  const created = await prisma.shopCapacity.create({ data });
  return NextResponse.json(created);
}
