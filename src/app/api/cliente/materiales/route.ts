import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";

// GET → materiales activos para el portal del cliente (sin exponer costos internos).
export async function GET() {
  const auth = await requireApiRole(["client"]);
  if (auth instanceof NextResponse) return auth;

  const materials = await prisma.material.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, thickness: true, unit: true },
  });

  return NextResponse.json(materials);
}
