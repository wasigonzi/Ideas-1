import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StoreProductDetail } from "@/components/StoreProductDetail";
import { LandingRenderer } from "@/components/landing-builder/LandingRenderer";
import type { LandingBlock } from "@/components/landing-builder/types";

export const revalidate = 60;

function parseJSON<T>(raw?: string | null, fallback: T = [] as unknown as T): T {
  try { return JSON.parse(raw ?? "") as T; } catch { return fallback; }
}

export async function generateStaticParams() {
  const products = await prisma.storeProduct.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.storeProduct.findUnique({ where: { slug } });
  if (!product) return {};

  const title = `${product.title} | Ideas, LLC`;
  const description =
    product.description?.replace(/<[^>]+>/g, "").trim().slice(0, 155) ||
    `Compra ${product.title} en Ideas, LLC — impresión y rotulación de gran formato en Puerto Rico.`;

  return {
    title,
    description,
    keywords: [product.title, product.category, "Puerto Rico", "impresión gran formato"].filter(Boolean),
    alternates: { canonical: `/tienda/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://printingideaspr.com/tienda/${slug}`,
      ...(product.image ? { images: [{ url: product.image, width: 1200, height: 630 }] } : {})
    }
  };
}

export default async function TiendaProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, templateBlocksRow] = await Promise.all([
    prisma.storeProduct.findUnique({ where: { slug } }),
    prisma.siteSetting.findUnique({ where: { key: "pageProductoTemplateJson" } }).catch(() => null),
  ]);
  if (!product || !product.active) notFound();

  const images = parseJSON<string[]>(product.images, []);
  // Build the full image list: cover first (if not already), then gallery
  const allImages: string[] = [];
  if (product.image && !images.includes(product.image)) allImages.push(product.image);
  allImages.push(...images.filter(Boolean));
  if (allImages.length === 0 && product.image) allImages.push(product.image);

  interface Variant { title: string; option1: string; option2: string; price: string; compareAtPrice?: string | null; available?: boolean; }
  const variants = parseJSON<Variant[]>(product.variants, []);

  // Parse template blocks — rendered above/below the product detail
  let templateBlocks: LandingBlock[] = [];
  if (templateBlocksRow?.value) {
    try { templateBlocks = JSON.parse(templateBlocksRow.value); } catch { /* ignore */ }
  }

  const productEl = (
    <StoreProductDetail
      product={{
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.image,
        priceFrom: product.priceFrom,
        allImages,
        variants,
      }}
    />
  );

  if (templateBlocks.length > 0) {
    return (
      <>
        {productEl}
        <LandingRenderer blocks={templateBlocks} />
      </>
    );
  }

  return productEl;
}
