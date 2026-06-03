import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";

// Empleado: cancelar su propia solicitud (solo si sigue pendiente).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["employee", "admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const reqRow = await prisma.timeOffRequest.findUnique({ where: { id } });
  if (!reqRow) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (reqRow.userId !== auth.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }
  await prisma.timeOffRequest.update({ where: { id }, data: { status: "cancelled" } });
  return NextResponse.json({ ok: true });
}
