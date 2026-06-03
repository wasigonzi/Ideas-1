import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-helpers";
import { loadProjectStages } from "@/lib/project-stages";

export async function GET() {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const stages = await loadProjectStages();
  return NextResponse.json(stages);
}
