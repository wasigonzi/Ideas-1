import { NextIntlClientProvider } from "next-intl";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Providers from "@/components/Providers";
import { PublicChrome } from "@/components/PublicChrome";
import { prisma } from "@/lib/prisma";

export function generateStaticParams() {
  return [{ locale: "es" }];
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {

  let whatsappRow = null;
  try {
    whatsappRow = await prisma.siteSetting.findUnique({ where: { key: "whatsapp" } });
  } catch {
    // DB unavailable — use default
  }
  const [messages] = await Promise.all([
    import("../../../messages/es.json").then((m) => m.default),
  ]);
  const whatsapp = whatsappRow?.value ?? "19393264007";

  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      <Providers>
        <PublicChrome><Navbar whatsapp={whatsapp} /></PublicChrome>
        <main>{children}</main>
        <PublicChrome><Footer whatsapp={whatsapp} /></PublicChrome>
        <WhatsAppButton whatsapp={whatsapp} />
      </Providers>
    </NextIntlClientProvider>
  );
}
