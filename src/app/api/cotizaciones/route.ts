import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendQuoteEmail } from "@/lib/mailer";
import { requireApiRole } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const ip = await getClientIp();
    const limited = checkRateLimit(`quote:${ip}`, 5, 60 * 60 * 1000); // 5/hour per IP
    if (limited) return limited;

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
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(quotes);
}
