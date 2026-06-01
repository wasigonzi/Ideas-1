import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/tareas/archive-done
// Marks all tasks with status="done" as archived=true so they disappear from the board.
export async function POST() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await prisma.task.updateMany({
    where: { status: "done", archived: false },
    data: { archived: true },
  });

  return NextResponse.json({ archived: result.count });
}
