import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { z } from "zod";

const ReviewSchema = z.object({
  action: z.enum(["approve", "deny"]),
  reviewNote: z.string().max(2000).optional().nullable(),
});

// Admin (PM): aprobar o denegar una solicitud pendiente.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const parsed = ReviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }

  const reqRow = await prisma.timeOffRequest.findUnique({ where: { id } });
  if (!reqRow) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }

  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: parsed.data.action === "approve" ? "approved" : "denied",
      reviewerId: auth.id,
      reviewNote: parsed.data.reviewNote || null,
      reviewedAt: new Date(),
    },
  });
  return NextResponse.json(updated);
}
