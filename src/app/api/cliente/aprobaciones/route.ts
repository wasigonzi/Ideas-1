import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";

// GET → aprobaciones pendientes y resueltas del cliente autenticado.
export async function GET() {
  const auth = await requireApiRole(["client"]);
  if (auth instanceof NextResponse) return auth;

  const approvals = await prisma.workProjectApproval.findMany({
    where: { clientId: auth.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { project: { select: { number: true, title: true } } },
  });

  const data = approvals.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    files: a.files ? (JSON.parse(a.files) as string[]) : [],
    status: a.status,
    clientNote: a.clientNote,
    decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    project: a.project ? { number: a.project.number, title: a.project.title } : null,
  }));

  return NextResponse.json(data);
}
