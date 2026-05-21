import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ALLOWED_FIELDS = ["status", "priority", "title", "description", "service", "total", "paid", "dueDate", "startDate"] as const;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      if (key === "dueDate" || key === "startDate") {
        data[key] = body[key] ? new Date(body[key]) : null;
      } else {
        data[key] = body[key];
      }
    }
  }
  if (data.status === "completed" && !("completedAt" in data)) {
    data.completedAt = new Date();
  }
  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json(order);
}
