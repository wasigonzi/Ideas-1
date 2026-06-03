import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const DecisionSchema = z.object({
  decision: z.enum(["approved", "changes"]),
  note: z.string().max(2000).optional().nullable(),
});

// POST → el cliente aprueba o pide cambios sobre una solicitud de aprobación.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["client"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const approval = await prisma.workProjectApproval.findUnique({ where: { id } });
  if (!approval || approval.clientId !== auth.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (approval.status !== "pending") {
    return NextResponse.json({ error: "Ya fue respondida" }, { status: 409 });
  }

  const { decision, note } = DecisionSchema.parse(await req.json());
  const updated = await prisma.workProjectApproval.update({
    where: { id },
    data: { status: decision, clientNote: note ?? null, decidedAt: new Date() },
  });
  return NextResponse.json(updated);
}
