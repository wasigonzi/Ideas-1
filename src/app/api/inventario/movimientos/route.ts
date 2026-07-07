import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";

export async function GET() {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const movements = await prisma.inventoryMovement.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            sku: true,
            category: true,
          }
        }
      }
    });
    return NextResponse.json(movements);
  } catch (err) {
    console.error("[api/inventario/movimientos GET] DB error:", err);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
