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

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.roleRate.findMany({ orderBy: { role: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const data = RoleRateSchema.parse(await req.json());
  const created = await prisma.roleRate.create({ data });
  return NextResponse.json(created);
}
