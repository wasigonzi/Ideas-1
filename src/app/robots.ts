import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/empleado", "/cliente", "/portal", "/api"]
      }
    ],
    sitemap: "https://printingideaspr.com/sitemap.xml"
  };
}
