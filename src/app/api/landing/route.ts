import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import type { LandingBlock } from "@/components/landing-builder/types";
import { DEFAULT_BLOCKS } from "@/components/landing-builder/registry";

const ALLOWED_KEYS = new Set([
  "landingJson",
  "pageServiciosJson",
  "pageProyectosJson",
  "pageNosotrosJson",
]);

function resolveKey(raw: string | null | undefined): string {
  const k = raw ?? "landingJson";
  return ALLOWED_KEYS.has(k) ? k : "landingJson";
}

export async function GET(req: Request) {
  const key = resolveKey(new URL(req.url).searchParams.get("key"));
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (row?.value) {
      const blocks: LandingBlock[] = JSON.parse(row.value);
      return NextResponse.json({ blocks });
    }
    return NextResponse.json({ blocks: key === "landingJson" ? DEFAULT_BLOCKS : [] });
  } catch {
    return NextResponse.json({ blocks: key === "landingJson" ? DEFAULT_BLOCKS : [] });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: { blocks: LandingBlock[]; key?: string } = await req.json();
  const key = resolveKey(body.key);
  const blocks = body.blocks;

  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(blocks) },
    create: { key, value: JSON.stringify(blocks) },
  });

  revalidatePath("/", "layout");
  revalidatePath("/es", "layout");
  revalidatePath("/en", "layout");
  revalidateTag("home");

  return NextResponse.json({ ok: true });
}
