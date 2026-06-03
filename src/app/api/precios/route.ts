import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-helpers";
import { getPricingParams, setPricingParams, quotePrice } from "@/lib/pricing";
import { z } from "zod";

// GET → parámetros globales de precio (markup, costo de tinta).
export async function GET() {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const params = await getPricingParams();
  return NextResponse.json(params);
}

const ParamsSchema = z.object({
  markup: z.coerce.number().positive().optional(),
  inkCostPerSqFt: z.coerce.number().min(0).optional(),
});

// PUT → actualiza parámetros globales (solo admin).
export async function PUT(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const data = ParamsSchema.parse(await req.json());
  await setPricingParams(data);
  return NextResponse.json(await getPricingParams());
}

const QuoteSchema = z.object({
  materialId: z.string().min(1),
  squareFeet: z.coerce.number().min(0),
  finishingCostPerSqFt: z.coerce.number().min(0).optional(),
});

// POST → cotiza el precio de una pieza por pie².
export async function POST(req: Request) {
  const auth = await requireApiRole(["admin", "employee"]);
  if (auth instanceof NextResponse) return auth;
  const data = QuoteSchema.parse(await req.json());
  const quote = await quotePrice(data);
  if (!quote) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
  return NextResponse.json(quote);
}
