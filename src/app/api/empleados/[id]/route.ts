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

const UpdateSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  email:       z.string().email().max(200).transform(s => s.toLowerCase()).optional(),
  password:    z.string().min(6).max(100).optional().nullable(),
  role:        z.enum(["admin", "employee", "client"]).optional(),
  phone:       z.string().max(30).optional().nullable(),
  position:    z.string().max(100).optional().nullable(),
  department:  z.string().max(100).optional().nullable(),
  company:     z.string().max(100).optional().nullable(),
  hourlyRate:  z.coerce.number().nonnegative().optional().nullable(),
  active:      z.coerce.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { password, ...data } = parsed.data;

  if (data.email) {
    const conflict = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (conflict) return NextResponse.json({ error: "Ya existe una cuenta con este email." }, { status: 409 });
  }

  const updateData: Record<string, unknown> = { ...data };
  if (password) updateData.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });
  await logAudit({
    actor: admin,
    action: "update",
    entity: "User",
    entityId: id,
    summary: `Editó la cuenta ${user.email} (${user.role})`,
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (admin.id === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  await prisma.user.delete({ where: { id } });
  await logAudit({
    actor: admin,
    action: "delete",
    entity: "User",
    entityId: id,
    summary: existing ? `Borró la cuenta ${existing.email} (${existing.role})` : `Borró la cuenta ${id}`,
  });
  return NextResponse.json({ ok: true });
}
