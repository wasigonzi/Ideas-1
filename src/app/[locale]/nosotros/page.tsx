import { CtaBand } from "@/components/CtaBand";
import { ClientsLogos } from "@/components/ClientsLogos";
import { Sparkles, Target, Heart, Lightbulb, Award, Clock } from "lucide-react";

const VALUES = [
  { icon: Clock, title: "Eficiencia", desc: "Cumplimos con tiempos de entrega sin comprometer la calidad." },
  { icon: Sparkles, title: "Personalización", desc: "Cada marca tiene una historia única y la reflejamos en nuestros productos." },
  { icon: Heart, title: "Compromiso", desc: "Nos involucramos en cada proyecto como si fuera nuestro." },
  { icon: Lightbulb, title: "Innovación", desc: "Nos mantenemos a la vanguardia en tecnología y diseño." },
  { icon: Award, title: "Calidad", desc: "Utilizamos materiales de primera y las mejores técnicas de impresión." }
];

export default function NosotrosPage() {
  return (
    <>
      <section className="pt-[120px] pb-12">
        <div className="container-x grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="eyebrow">Sobre nosotros</span>
            <h1 className="heading-xl mt-3">Expertos en rotulación e impresión</h1>
            <p className="mt-6 text-2xl text-white/85 font-medium leading-snug">
              Convertimos ideas en soluciones visuales que impactan y comunican.
            </p>
          </div>
          <div className="lg:mt-16 space-y-5 text-white/70 text-lg leading-relaxed">
            <p>
              <strong className="text-[var(--color-brand-400)]">Ideas</strong> proporciona soluciones de
              impresión digital a gran escala, rotulación de flotas comerciales y fabricación de rótulos
              de alta calidad.
            </p>
            <p>
              Ofrecemos una amplia variedad de servicios y productos para su empresa, municipio o agencia.
              Empresa dedicada a la manufactura de rótulos e impresiones de alto volumen.
            </p>
            <p>
              Nacimos con la misión de ofrecer soluciones innovadoras en rotulación, impresión e ingeniería.
            </p>
          </div>
        </div>
      </section>

      <ClientsLogos title="Marcas que confían en nosotros" />

      <section className="section">
        <div className="container-x grid md:grid-cols-2 gap-6">
          <div className="card p-10 bg-[var(--color-ink-900)] text-white relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[var(--color-brand-500)]/20 blur-3xl" />
            <Target className="text-[var(--color-brand-400)]" />
            <h2 className="heading-lg mt-4">Nuestra Misión</h2>
            <p className="mt-5 text-white/80 text-lg leading-relaxed">
              Proporcionar soluciones integrales de rotulación y señalización de alta calidad,
              ofreciendo servicios eficientes y personalizados para satisfacer las necesidades de
              nuestros clientes en Puerto Rico y en el extranjero. Nos esforzamos por superar las
              expectativas, entregando cada proyecto con profesionalismo, cumpliendo con los más altos
              estándares de la industria y asegurándonos de que se realice dentro del presupuesto y a tiempo.
            </p>
          </div>

          <div className="card p-10 bg-[var(--color-brand-500)] text-white relative overflow-hidden">
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
            <Sparkles />
            <h2 className="heading-lg mt-4">Nuestra Visión</h2>
            <p className="mt-5 text-white/95 text-lg leading-relaxed">
              Ser líderes en el sector de rotulación e impresión a gran escala, reconocidos por nuestra
              innovación, excelencia en el servicio y capacidad para transformar las ideas en realidad.
              Continuamos expandiendo nuestras operaciones internacionales para convertirnos en un
              referente en la fabricación, instalación y mantenimiento de rotulación.
            </p>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-x">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow">Nuestros valores</span>
            <h2 className="heading-lg mt-3">Lo que nos define</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="card p-6 text-center hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] grid place-items-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-white">{v.title}</h3>
                  <p className="mt-2 text-sm text-white/65 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
