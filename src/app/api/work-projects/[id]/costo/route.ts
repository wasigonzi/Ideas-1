import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-helpers";
import { projectCost } from "@/lib/pricing";

// GET → reporte de costo real vs. facturación de un proyecto.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const report = await projectCost(id);
  if (!report) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  return NextResponse.json(report);
}
