import { prisma } from "@/lib/prisma";
import { ShoppingBag, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";

export const revalidate = 60;

function parseJSON<T>(raw?: string | null, fallback: T = [] as unknown as T): T {
  try { return JSON.parse(raw ?? "") as T; } catch { return fallback; }
}

interface Variant {
  title: string;
  option1?: string;
  option2?: string;
  price: string;
  compareAtPrice?: string | null;
  available?: boolean;
}

export default async function TiendaPage() {
  const [products, blocksRow] = await Promise.all([
    prisma.storeProduct.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.siteSetting.findUnique({ where: { key: "pageTiendaJson" } }).catch(() => null),
  ]);

  if (blocksRow?.value) {
    try {
      const blocks: LandingBlock[] = JSON.parse(blocksRow.value);
      if (blocks.length > 0) return <LandingRenderer blocks={blocks} />;
    } catch { /* fall through */ }
  }

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <>
      {/* Hero */}
      <section className="pt-[120px] pb-10">
        <div className="container-x">
          <span className="eyebrow">Tienda</span>
          <h1 className="heading-xl mt-3 max-w-3xl">
            Productos de <span className="text-brand-400">Impresión</span>
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-2xl">
            Stickers, banners, D-Boards, roll-ups y más. Todos impresión full color, producción
            rápida y envío incluido.
          </p>
        </div>
      </section>

      {/* Category filter chips (static display) */}
      {categories.length > 0 && (
        <section className="pb-6">
          <div className="container-x flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/5 text-white/70"
              >
                <Tag className="size-3" />
                {cat}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Products grid */}
      <section className="section-tight">
        <div className="container-x">
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-white/40">
              <ShoppingBag className="size-14" />
              <p className="text-lg">No hay productos disponibles por el momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const images = parseJSON<string[]>(product.images, []);
                const coverImg = product.image ?? images[0];
                const variants = parseJSON<Variant[]>(product.variants, []);
                const minPrice = variants.length > 0
                  ? Math.min(...variants.map((v) => parseFloat(v.price) || 0))
                  : product.priceFrom;

                return (
                  <Link key={product.id} href={`/tienda/${product.slug}`} className="card group flex flex-col overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                      {coverImg ? (
                        <Image
                          src={coverImg}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="size-16 text-white/20" />
                        </div>
                      )}
                      {product.category && (
                        <span className="absolute top-3 left-3 bg-ink-950/80 backdrop-blur text-white/80 text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                          {product.category}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5 gap-3">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                        {product.title}
                      </h3>

                      {/* Variants preview */}
                      {variants.length > 1 && (
                        <div className="flex flex-wrap gap-1.5">
                          {variants.slice(0, 4).map((v, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded border border-white/10 bg-white/5 text-white/60"
                            >
                              {v.option1}
                            </span>
                          ))}
                          {variants.length > 4 && (
                            <span className="text-xs px-2 py-0.5 text-white/40">+{variants.length - 4} más</span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                        <div>
                          {minPrice > 0 && (
                            <p className="text-brand-400 font-black text-xl">
                              {variants.length > 1 ? "Desde " : ""}
                              ${minPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <span className="btn btn-brand text-sm py-2 px-4 shrink-0">
                          Ver producto
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-tight">
        <div className="container-x">
          <div className="card p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              ¿No encuentras lo que buscas?
            </h2>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              Contáctanos y te preparamos una cotización personalizada para tu proyecto.
            </p>
            <Link href="/cotizacion" className="btn btn-brand">
              Solicitar cotización
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
