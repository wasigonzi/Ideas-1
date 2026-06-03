import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-helpers";
import { getMonthlyGoal, setMonthlyGoal } from "@/lib/intelligence";
import { z } from "zod";

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ monthlyGoal: await getMonthlyGoal() });
}

const Schema = z.object({ monthlyGoal: z.coerce.number().positive() });

export async function PUT(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const { monthlyGoal } = Schema.parse(await req.json());
  await setMonthlyGoal(monthlyGoal);
  return NextResponse.json({ monthlyGoal });
}
