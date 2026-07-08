import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/tienda/materiales -> Lists active materials for the public calculator
export async function GET() {
  try {
    const items = await prisma.material.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        category: true,
        thickness: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar materiales" }, { status: 500 });
  }
}
