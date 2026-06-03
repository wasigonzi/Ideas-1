import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { nextProjectNumber } from "@/lib/project-stages";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const CreateSchema = z.object({
  number: z.string().min(1).max(40).optional(),
  estimateNumber: z.string().max(40).optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  stage: z.string().max(40).default("intake"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  clientId: z.string().optional().nullable(),
  clientName: z.string().max(160).optional().nullable(),
  clientEmail: z.string().max(160).optional().nullable(),
  clientPhone: z.string().max(60).optional().nullable(),
  quoted: z.coerce.number().min(0).default(0),
  dueDate: z.coerce.date().optional().nullable(),
});

export async function GET() {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const items = await prisma.workProject.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      _count: { select: { tasks: true, documents: true } },
    },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const data = CreateSchema.parse(await req.json());

  // El número de proyecto se deriva del estimado; si no se provee, se genera
  // uno secuencial.
  const number =
    data.number?.trim() || data.estimateNumber?.trim() || (await nextProjectNumber());

  const exists = await prisma.workProject.findUnique({ where: { number } });
  if (exists) return NextResponse.json({ error: "number_taken" }, { status: 409 });

  const created = await prisma.workProject.create({
    data: {
      number,
      estimateNumber: data.estimateNumber || null,
      title: data.title,
      description: data.description || null,
      stage: data.stage,
      priority: data.priority,
      clientId: data.clientId || null,
      clientName: data.clientName || null,
      clientEmail: data.clientEmail || null,
      clientPhone: data.clientPhone || null,
      quoted: data.quoted,
      dueDate: data.dueDate || null,
    },
  });
  await logAudit({
    actor: auth,
    action: "create",
    entity: "WorkProject",
    entityId: created.id,
    summary: `Creó el proyecto ${created.number} — ${created.title}`,
  });
  return NextResponse.json(created);
}
