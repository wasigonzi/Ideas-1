import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { projectCost } from "@/lib/pricing";
import { z } from "zod";

// GET → ficha técnica de cierre del proyecto (o null si aún no existe).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const sheet = await prisma.workProjectTechSheet.findUnique({ where: { projectId: id } });
  return NextResponse.json(sheet);
}

const SheetSchema = z.object({
  materialName: z.string().max(160).optional().nullable(),
  printType: z.string().max(120).optional().nullable(),
  rip: z.string().max(120).optional().nullable(),
  machine: z.string().max(120).optional().nullable(),
  materialQty: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  materialCost: z.coerce.number().min(0).optional(),
  inkCost: z.coerce.number().min(0).optional(),
  otherCost: z.coerce.number().min(0).optional(),
});

// PUT → crea o actualiza la ficha técnica y congela el costo total real
// (mano de obra calculada + materiales/tinta/otros de la ficha).
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const project = await prisma.workProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const data = SheetSchema.parse(await req.json());
  const materialCost = data.materialCost ?? 0;
  const inkCost = data.inkCost ?? 0;
  const otherCost = data.otherCost ?? 0;

  // Mano de obra actual desde las sesiones de trabajo.
  const cost = await projectCost(id);
  const laborCost = cost?.laborCost ?? 0;
  const totalCost = laborCost + materialCost + inkCost + otherCost;

  const sheet = await prisma.workProjectTechSheet.upsert({
    where: { projectId: id },
    create: {
      projectId: id,
      materialName: data.materialName ?? null,
      printType: data.printType ?? null,
      rip: data.rip ?? null,
      machine: data.machine ?? null,
      materialQty: data.materialQty ?? null,
      notes: data.notes ?? null,
      materialCost,
      inkCost,
      laborCost,
      otherCost,
      totalCost,
    },
    update: {
      materialName: data.materialName ?? null,
      printType: data.printType ?? null,
      rip: data.rip ?? null,
      machine: data.machine ?? null,
      materialQty: data.materialQty ?? null,
      notes: data.notes ?? null,
      materialCost,
      inkCost,
      laborCost,
      otherCost,
      totalCost,
    },
  });
  return NextResponse.json(sheet);
}
