import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const CreateSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    type: z.enum(["vacation", "sick", "personal", "unpaid", "other"]).default("vacation"),
    reason: z.string().max(2000).optional().nullable(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "La fecha final debe ser igual o posterior a la inicial",
    path: ["endDate"],
  });

// Empleado/admin: lista sus propias solicitudes.
export async function GET() {
  const auth = await requireApiRole(["employee", "admin"]);
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.timeOffRequest.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { id: true, name: true } } },
  });
  return NextResponse.json(items);
}

// Empleado/admin: crea una solicitud para sí mismo.
export async function POST(req: Request) {
  const auth = await requireApiRole(["employee", "admin"]);
  if (auth instanceof NextResponse) return auth;
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.timeOffRequest.create({
    data: {
      userId: auth.id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      type: parsed.data.type,
      reason: parsed.data.reason || null,
    },
  });
  return NextResponse.json(created);
}
