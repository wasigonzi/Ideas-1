import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";

// Admin (PM): lista todas las solicitudes, opcionalmente filtradas por estado.
export async function GET(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const status = new URL(req.url).searchParams.get("status") || undefined;
  const items = await prisma.timeOffRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { startDate: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(items);
}
