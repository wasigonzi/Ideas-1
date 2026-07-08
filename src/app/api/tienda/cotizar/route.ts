import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPricingParams } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { materialId, squareFeet } = body;
    if (!materialId || squareFeet == null) {
      return NextResponse.json({ error: "materialId y squareFeet requeridos" }, { status: 400 });
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId, active: true }
    });
    if (!material) {
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
    }

    const params = await getPricingParams();
    const sqft = Math.max(0, Number(squareFeet));
    
    // Standard calculation formula from lib/pricing
    const matPerSqFt = material.costPerSqFt;
    const materialCost = matPerSqFt * sqft;
    const inkCost = params.inkCostPerSqFt * sqft;
    const baseCost = materialCost + inkCost;
    const price = baseCost * params.markup;

    return NextResponse.json({
      price: Math.round(price * 100) / 100,
      squareFeet: sqft,
      materialName: material.name,
      thickness: material.thickness
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cotizar" }, { status: 500 });
  }
}
