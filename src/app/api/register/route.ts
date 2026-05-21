import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const company = body.company ? String(body.company).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Completa todos los campos. La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con este email." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: "client",
        company,
        phone
      }
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 500 });
  }
}
