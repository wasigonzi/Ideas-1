import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendQuoteEmail } from "@/lib/mailer";
import { auth } from "@/auth";

const QuoteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(160).optional().nullable(),
  service: z.string().max(120).optional().nullable(),
  budget: z.string().max(80).optional().nullable(),
  deadline: z.string().max(80).optional().nullable(),
  message: z.string().min(10).max(4000)
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = QuoteSchema.parse(json);
    const quote = await prisma.quote.create({ data });
    sendQuoteEmail(data).catch((e) => console.error("[mailer]", e));
    return NextResponse.json({ ok: true, id: quote.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "validation", details: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(quotes);
}
