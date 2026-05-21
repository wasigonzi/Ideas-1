import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    select: { id: true, number: true, title: true, clientId: true, status: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
