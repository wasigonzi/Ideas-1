import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { mergeConfig } from "@/lib/site-config";

export async function GET() {
  const rows = await prisma.siteSetting.findMany();
  return NextResponse.json(mergeConfig(rows));
}

export async function PUT(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: Record<string, unknown> = await req.json();

  const ops = Object.entries(body).map(([key, value]) => {
    const strValue =
      Array.isArray(value) || (typeof value === "object" && value !== null)
        ? JSON.stringify(value)
        : String(value ?? "");
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value: strValue },
      create: { key, value: strValue },
    });
  });

  await prisma.$transaction(ops);

  // Immediately invalidate the landing pages so they pick up the new content.
  revalidatePath("/");
  revalidatePath("/es");
  revalidatePath("/en");
  revalidateTag("home");

  return NextResponse.json({ ok: true });
}
