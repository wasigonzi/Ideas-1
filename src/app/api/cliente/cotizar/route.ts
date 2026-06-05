import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth-helpers";
import { quotePrice } from "@/lib/pricing";
import { z } from "zod";

const QuoteSchema = z.object({
  materialId: z.string().min(1),
  widthIn: z.coerce.number().min(1).max(600),
  heightIn: z.coerce.number().min(1).max(600),
  qty: z.coerce.number().int().min(1).max(9999),
  hasInstall: z.coerce.boolean().default(false),
});

// Número de días hábiles estimados para entrega (configurable en SiteSetting a futuro).
const DAYS_NO_INSTALL = 7;
const DAYS_WITH_INSTALL = 14;
// Recargo por instalación sobre el precio base (20%).
const INSTALL_SURCHARGE = 1.20;

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++; // skip weekends
  }
  return result;
}

// POST → el cliente cotiza un trabajo desde el portal.
// Solo devuelve el precio final; los costos internos nunca se exponen.
export async function POST(req: Request) {
  const auth = await requireApiRole(["client"]);
  if (auth instanceof NextResponse) return auth;

  const parsed = QuoteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { materialId, widthIn, heightIn, qty, hasInstall } = parsed.data;

  const sqftEach = (widthIn / 12) * (heightIn / 12);
  const totalSqft = sqftEach * qty;

  const result = await quotePrice({ materialId, squareFeet: totalSqft });
  if (!result) {
    return NextResponse.json({ error: "Material no disponible" }, { status: 404 });
  }

  const basePrice = result.price;
  const totalPrice = basePrice * (hasInstall ? INSTALL_SURCHARGE : 1);
  const priceEach = qty > 0 ? totalPrice / qty : 0;
  const pricePerSqFt = totalSqft > 0 ? totalPrice / totalSqft : 0;

  const estimatedDelivery = addBusinessDays(
    new Date(),
    hasInstall ? DAYS_WITH_INSTALL : DAYS_NO_INSTALL,
  );

  // Guarda la cotización vinculada al cliente para que el admin la vea.
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { name: true, category: true },
  });

  await prisma.quote.create({
    data: {
      name: auth.name ?? "Cliente",
      email: auth.email ?? "",
      service: material ? `${material.name} (${material.category})` : "Portal",
      message:
        `${qty} pieza(s) · ${widthIn}"×${heightIn}" · ${sqftEach.toFixed(2)} ft² c/u · ${totalSqft.toFixed(2)} ft² total` +
        (hasInstall ? " · Con instalación" : " · Sin instalación") +
        ` · Precio cotizado: $${totalPrice.toFixed(2)}`,
      status: "new",
    },
  });

  return NextResponse.json({
    squareFeetEach: parseFloat(sqftEach.toFixed(4)),
    totalSqFt: parseFloat(totalSqft.toFixed(4)),
    qty,
    priceEach: parseFloat(priceEach.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    pricePerSqFt: parseFloat(pricePerSqFt.toFixed(4)),
    hasInstall,
    estimatedDelivery: estimatedDelivery.toISOString().split("T")[0],
  });
}
