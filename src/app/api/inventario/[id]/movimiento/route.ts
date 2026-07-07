import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const MovementSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().gt(0, { message: "La cantidad debe ser mayor que 0" }),
  note: z.string().min(1, { message: "Debes ingresar una nota o motivo para el movimiento" }).max(1000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authUser = await requireApiRole(["admin"]);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data = MovementSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the current inventory item
      const item = await tx.inventoryItem.findUnique({
        where: { id },
      });

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      const prevStock = item.stock;
      let newStock = prevStock;

      if (data.type === "in") {
        newStock = prevStock + data.quantity;
      } else if (data.type === "out") {
        newStock = prevStock - data.quantity;
      } else if (data.type === "adjustment") {
        newStock = data.quantity;
      }

      // 2. Update item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { stock: newStock },
      });

      // 3. Create movement log
      const movement = await tx.inventoryMovement.create({
        data: {
          itemId: id,
          type: data.type,
          quantity: data.type === "out" ? -data.quantity : data.quantity,
          prevStock,
          newStock,
          note: data.note,
          userId: authUser.id,
          userEmail: authUser.email,
        },
      });

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          actorId: authUser.id,
          actorEmail: authUser.email,
          actorRole: authUser.role,
          action: "update",
          entity: "InventoryItem",
          entityId: id,
          summary: `Ajuste de inventario (${data.type}) para ${item.name}: ${data.type === "out" ? "-" : ""}${data.quantity} ${item.unit}. Motivo: ${data.note}`,
          metadata: JSON.stringify(movement),
        },
      });

      return { updatedItem, movement };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/inventario/[id]/movimiento POST] error:", err);
    if (err.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Artículo de inventario no encontrado" }, { status: 404 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "error del servidor" }, { status: 500 });
  }
}
