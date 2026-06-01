import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const profileSelect = {
  id: true, name: true, email: true, role: true,
  phone: true, position: true, department: true, company: true,
  avatar: true,
};

const UpdateSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  phone:       z.string().max(30).optional().nullable(),
  position:    z.string().max(100).optional().nullable(),
  department:  z.string().max(100).optional().nullable(),
  company:     z.string().max(100).optional().nullable(),
  avatar:      z.string().url().max(500).optional().nullable(),
  // password change
  currentPassword: z.string().min(1).optional(),
  newPassword:     z.string().min(6).max(100).optional(),
});

async function getUser() {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!u?.id) return null;
  return u as { id: string; role: string };
}

export async function GET() {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: u.id },
    select: profileSelect,
  });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { currentPassword, newPassword, ...data } = parsed.data;

  const updateData: Record<string, unknown> = { ...data };

  // Handle password change
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Se requiere la contraseña actual." }, { status: 400 });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: u.id }, select: { password: true } });
    if (!dbUser) return NextResponse.json({ error: "not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const profile = await prisma.user.update({
    where: { id: u.id },
    data: updateData,
    select: profileSelect,
  });

  return NextResponse.json(profile);
}
