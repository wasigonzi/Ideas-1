import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import type { LandingBlock } from "@/components/landing-builder/types";
import { DEFAULT_BLOCKS } from "@/components/landing-builder/registry";

const KEY = "landingJson";

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (row?.value) {
      const blocks: LandingBlock[] = JSON.parse(row.value);
      return NextResponse.json({ blocks });
    }
    return NextResponse.json({ blocks: DEFAULT_BLOCKS });
  } catch {
    return NextResponse.json({ blocks: DEFAULT_BLOCKS });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: { blocks: LandingBlock[] } = await req.json();
  const blocks = body.blocks;

  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.siteSetting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(blocks) },
    create: { key: KEY, value: JSON.stringify(blocks) },
  });

  // Revalidate all landing pages so any ISR cache is cleared
  revalidatePath("/", "layout");
  revalidatePath("/es", "layout");
  revalidatePath("/en", "layout");
  revalidateTag("home");

  return NextResponse.json({ ok: true });
}
