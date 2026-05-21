import { useTranslations } from "next-intl";
import { QuoteForm } from "@/components/QuoteForm";

export default function CotizacionPage() {
  const t = useTranslations("quote");
  return (
    <section className="pt-[120px] pb-24">
      <div className="container-x grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <span className="eyebrow">Cotización</span>
          <h1 className="heading-xl mt-3">{t("title")}</h1>
          <p className="mt-5 text-white/70 text-lg leading-relaxed">{t("subtitle")}</p>
          <div className="mt-8 space-y-3 text-sm text-white/85">
            <div>📞 939-356-3399</div>
            <div>✉️ ventas@printingideaspr.com</div>
            <div>📍 Puerto Rico</div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
