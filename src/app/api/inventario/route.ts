import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const InventoryItemSchema = z.object({
  sku: z.string().max(100).optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().min(1).max(100),
  stock: z.coerce.number().default(0),
  minStock: z.coerce.number().default(0),
  unit: z.string().max(50).default("unidades"),
  unitCost: z.coerce.number().min(0).default(0),
  supplier: z.string().max(200).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export async function GET() {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[api/inventario GET] DB error:", err);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const data = InventoryItemSchema.parse(await req.json());
    
    // Check SKU uniqueness if provided
    if (data.sku) {
      const existing = await prisma.inventoryItem.findUnique({
        where: { sku: data.sku }
      });
      if (existing) {
        return NextResponse.json({ error: "El SKU ya está registrado" }, { status: 400 });
      }
    }

    const created = await prisma.inventoryItem.create({ data });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        actorEmail: authUser.email,
        actorRole: authUser.role,
        action: "create",
        entity: "InventoryItem",
        entityId: created.id,
        summary: `Creado artículo de inventario: ${created.name}`,
        metadata: JSON.stringify(created),
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[api/inventario POST] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "error del servidor" }, { status: 500 });
  }
}
