import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://printingideaspr.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/servicios`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/proyectos`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/nosotros`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/tienda`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/cotizacion`, changeFrequency: "yearly", priority: 0.5 }
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.storeProduct.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true }
    });
    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/tienda/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6
    }));
  } catch {
    // DB unavailable — ship static routes only
  }

  return [...staticRoutes, ...productRoutes];
}
