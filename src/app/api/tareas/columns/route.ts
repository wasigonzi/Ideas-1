import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  ensureColumnsMaterialized,
  isValidAccent,
  loadTaskColumns,
  slugifyKey,
  uniquifyKey
} from "@/lib/task-columns";

export async function GET() {
  const cols = await loadTaskColumns();
  return NextResponse.json(cols);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = String(body.label ?? "").trim();
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
  if (label.length > 60)
    return NextResponse.json({ error: "label too long" }, { status: 400 });
  const accent = isValidAccent(body.accent) ? body.accent : null;

  await ensureColumnsMaterialized();

  // Build a unique key from the label (or from a caller-provided key).
  const existing = await prisma.taskColumn.findMany({ select: { key: true } });
  const used = new Set(existing.map((e) => e.key));
  const baseKey =
    typeof body.key === "string" && body.key.trim()
      ? slugifyKey(body.key)
      : slugifyKey(label);
  const key = uniquifyKey(baseKey, used);

  // Append at the end.
  const last = await prisma.taskColumn.findFirst({
    orderBy: { position: "desc" },
    select: { position: true }
  });
  const position = (last?.position ?? 0) + 1000;

  const col = await prisma.taskColumn.create({
    data: { key, label, accent, position }
  });
  return NextResponse.json(col, { status: 201 });
}
