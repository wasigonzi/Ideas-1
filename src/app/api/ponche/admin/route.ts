import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hoursBetween } from "@/lib/time";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.userId || !body.in) {
    return NextResponse.json({ error: "userId and in required" }, { status: 400 });
  }
  const inAt = new Date(body.in);
  const outAt = body.out ? new Date(body.out) : null;
  const punch = await prisma.punch.create({
    data: {
      userId: String(body.userId),
      in: inAt,
      out: outAt,
      hours: outAt ? Math.round(hoursBetween(inAt, outAt) * 100) / 100 : null,
      note: body.note ? String(body.note) : null,
      source: "admin"
    }
  });
  return NextResponse.json(punch, { status: 201 });
}
