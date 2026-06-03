import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";

// GET → lista paginada de la bitácora de auditoría. Filtros: ?entity, ?action,
// ?actorId, ?take (máx 200), ?cursor (id para paginación).
export async function GET(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity");
  const action = searchParams.get("action");
  const actorId = searchParams.get("actorId");
  const take = Math.min(Number(searchParams.get("take") ?? 50) || 50, 200);
  const cursor = searchParams.get("cursor");

  const where: { entity?: string; action?: string; actorId?: string } = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;

  const items = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actor: { select: { id: true, name: true, email: true } } },
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  return NextResponse.json({ items: page, nextCursor });
}
