import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (u?.role !== "admin") return null;
  return u as { id: string; role: string };
}

const userSelect = {
  id: true, name: true, email: true, role: true,
  phone: true, position: true, department: true, company: true,
  hourlyRate: true, active: true, avatar: true, createdAt: true
};

const CreateSchema = z.object({
  name:        z.string().min(2).max(100),
  email:       z.string().email().max(200).transform(s => s.toLowerCase()),
  password:    z.string().min(6).max(100),
  role:        z.enum(["admin", "employee", "client"]).default("employee"),
  phone:       z.string().max(30).optional().nullable(),
  position:    z.string().max(100).optional().nullable(),
  department:  z.string().max(100).optional().nullable(),
  company:     z.string().max(100).optional().nullable(),
  hourlyRate:  z.coerce.number().nonnegative().optional().nullable(),
  active:      z.coerce.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!u?.id || !["admin", "employee"].includes(u.role ?? "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Employees only get the fields needed for UI (name, avatar, role) — no sensitive data
  if (u.role === "employee") {
    const users = await prisma.user.findMany({
      where: { active: true, role: { in: ["admin", "employee"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, avatar: true, company: true },
    });
    return NextResponse.json(users);
  }
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: userSelect,
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { password, ...data } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con este email." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hash },
    select: userSelect,
  });
  await logAudit({
    actor: admin,
    action: "create",
    entity: "User",
    entityId: user.id,
    summary: `Creó la cuenta ${user.email} (${user.role})`,
  });
  return NextResponse.json(user, { status: 201 });
}
