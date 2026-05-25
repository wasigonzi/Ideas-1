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
  let footerRows: { key: string; value: string }[] = [];
  try {
    [whatsappRow, footerRows] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: "whatsapp" } }),
      prisma.siteSetting.findMany({
        where: { key: { in: [
          "footer_description",
          "footer_member_1_href", "footer_member_1_label", "footer_member_1_logo",
          "footer_member_2_href", "footer_member_2_label", "footer_member_2_logo",
          "footer_member_3_href", "footer_member_3_label", "footer_member_3_logo",
        ] } },
      }),
    ]);
  } catch {
    // DB unavailable — use defaults
  }
  const [messages] = await Promise.all([
    import("../../../messages/es.json").then((m) => m.default),
  ]);
  const whatsapp = whatsappRow?.value ?? "19393264007";

  const fs: Record<string, string> = {};
  for (const r of footerRows) fs[r.key] = r.value;

  const footerDescription = fs.footer_description || undefined;
  const footerMembers = [1, 2, 3]
    .map((n) => ({
      href:  fs[`footer_member_${n}_href`]  ?? "",
      label: fs[`footer_member_${n}_label`] ?? "",
      logo:  fs[`footer_member_${n}_logo`]  ?? "",
    }))
    .filter((m) => m.logo);
  const resolvedMembers = footerMembers.length > 0 ? footerMembers : undefined;

  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      <Providers>
        <PublicChrome><Navbar whatsapp={whatsapp} /></PublicChrome>
        <main>{children}</main>
        <PublicChrome><Footer whatsapp={whatsapp} description={footerDescription} members={resolvedMembers} /></PublicChrome>
        <WhatsAppButton whatsapp={whatsapp} />
      </Providers>
    </NextIntlClientProvider>
  );
}
