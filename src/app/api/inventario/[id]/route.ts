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

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { id } = await ctx.params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { movements: { take: 10, orderBy: { createdAt: "desc" } } }
    });
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[api/inventario/[id] GET] DB error:", err);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { id } = await ctx.params;
    const data = InventoryItemSchema.parse(await req.json());

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== item.sku) {
      const existing = await prisma.inventoryItem.findUnique({
        where: { sku: data.sku }
      });
      if (existing) {
        return NextResponse.json({ error: "El SKU ya está registrado por otro artículo" }, { status: 400 });
      }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        actorEmail: authUser.email,
        actorRole: authUser.role,
        action: "update",
        entity: "InventoryItem",
        entityId: updated.id,
        summary: `Actualizado artículo de inventario: ${updated.name}`,
        metadata: JSON.stringify({ before: item, after: updated }),
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[api/inventario/[id] PUT] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "error del servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { id } = await ctx.params;
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

    await prisma.inventoryItem.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        actorEmail: authUser.email,
        actorRole: authUser.role,
        action: "delete",
        entity: "InventoryItem",
        entityId: id,
        summary: `Eliminado artículo de inventario: ${item.name}`,
        metadata: JSON.stringify(item),
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/inventario/[id] DELETE] error:", err);
    return NextResponse.json({ error: "error del servidor" }, { status: 500 });
  }
}
