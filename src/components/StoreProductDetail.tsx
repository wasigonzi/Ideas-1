"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Tag, ArrowLeft } from "lucide-react";

interface Variant {
  title: string;
  option1: string;
  option2: string;
  price: string;
  compareAtPrice?: string | null;
  available?: boolean;
}

interface Props {
  product: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    category?: string | null;
    image?: string | null;
    priceFrom: number;
    allImages: string[];
    variants: Variant[];
  };
}

function normalizeProductDescription(html?: string | null) {
  if (!html) return "";
  return html.replace(/<p>\s*•\s*([\s\S]*?)<\/p>/g, (_match, content: string) => {
    const items = content
      .split(/<br\s*\/?>\s*•\s*/i)
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length === 0) return "";
    return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  });
}

export function StoreProductDetail({ product }: Props) {
  const { allImages, variants, title, description, category } = product;
  const formattedDescription = normalizeProductDescription(description);

  // Gallery state
  const [activeImg, setActiveImg] = useState(0);
  const prevImg = () => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % allImages.length);

  // Build unique option1 values (sizes/dimensions)
  const option1Values = [...new Set(variants.map((v) => v.option1).filter(Boolean))];
  const [selectedOption1, setSelectedOption1] = useState(option1Values[0] ?? "");

  // Filtered variants by selected option1
  const filteredVariants = variants.filter((v) => v.option1 === selectedOption1);
  const selectedVariant = filteredVariants[0] ?? variants[0];
  const price = selectedVariant ? parseFloat(selectedVariant.price) : product.priceFrom;
  const compareAt = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice) : null;

  // Option2 label (design fee line, e.g. "Diseño gráfico (Incluye 3 cambios máximo) $75")
  const option2Label = selectedVariant?.option2 && selectedVariant.option2.trim() ? selectedVariant.option2 : null;

  const currentImg = allImages[activeImg] ?? product.image;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container-x pt-[140px] pb-4">
        <Link href="/tienda" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-brand-400 transition-colors">
          <ArrowLeft className="size-3.5" />
          Tienda
        </Link>
        {category && (
          <span className="text-white/30 mx-2 text-sm">·</span>
        )}
        {category && <span className="text-white/40 text-sm">{category}</span>}
      </div>

      {/* Main product area */}
      <section className="container-x pb-16">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-start">

          {/* ── LEFT: Image gallery ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-ink-800 border border-white/8 group">
              {currentImg ? (
                <Image
                  src={currentImg}
                  alt={title}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                  unoptimized
                />
              ) : (
                <div className="size-full flex items-center justify-center text-white/20 text-6xl">📦</div>
              )}

              {/* Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  {/* Counter */}
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white/80 text-xs px-3 py-1 rounded-full">
                    {activeImg + 1} / {allImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative shrink-0 size-16 sm:size-20 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImg
                        ? "border-brand-400 scale-105 shadow-lg shadow-brand-500/20"
                        : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                    }`}
                  >
                    <Image src={url} alt={`${title} ${i + 1}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product info ── */}
          <div className="space-y-6 lg:sticky lg:top-28">
            {/* Category tag */}
            {category && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400/80 uppercase tracking-widest">
                <Tag className="size-3" />
                {category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-brand-400">
                ${price.toFixed(2)}
              </span>
              {compareAt && compareAt > price && (
                <span className="text-lg text-white/40 line-through">
                  ${compareAt.toFixed(2)}
                </span>
              )}
              {!selectedVariant && variants.length > 1 && (
                <span className="text-sm text-white/50">Desde</span>
              )}
            </div>

            {/* Option 1 — Size pills */}
            {option1Values.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wide">
                  Tamaño
                </p>
                <div className="flex flex-wrap gap-2">
                  {option1Values.map((val) => (
                    <button
                      key={val}
                      onClick={() => setSelectedOption1(val)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedOption1 === val
                          ? "bg-white text-ink-900 border-white shadow-lg"
                          : "bg-transparent text-white/80 border-white/25 hover:border-white/60 hover:text-white"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Option 2 label (design fee, etc.) */}
            {option2Label && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <span className="text-sm text-white/80">{option2Label}</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* CTA */}
            <div className="space-y-3">
              <Link
                href={`/cotizacion?producto=${encodeURIComponent(title)}${selectedOption1 ? `&tamano=${encodeURIComponent(selectedOption1)}` : ""}`}
                className="btn btn-brand w-full text-base py-4 justify-center"
              >
                Solicitar cotización
              </Link>
              <Link
                href={`https://wa.me/19393264007?text=${encodeURIComponent(`Hola, me interesa el producto: ${title}${selectedOption1 ? ` (${selectedOption1})` : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full text-base py-4 justify-center gap-2"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Consultar por WhatsApp
              </Link>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        {formattedDescription && (
          <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden shadow-2xl shadow-black/20">
            <div className="grid lg:grid-cols-[0.34fr_0.66fr]">
              <div className="p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent">
                <span className="eyebrow">Detalles</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">
                  Descripción del producto
                </h2>
                <p className="mt-4 text-sm sm:text-base text-white/55 leading-relaxed">
                  Información clave, tamaños disponibles, calidad de impresión y recomendaciones para este producto.
                </p>
              </div>
              <div
                className="prose-product p-6 sm:p-8 lg:p-10"
                dangerouslySetInnerHTML={{ __html: formattedDescription }}
              />
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
