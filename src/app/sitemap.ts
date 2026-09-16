import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

/**
 * Plan du site.
 *
 * Les pages du tunnel de commande et de l'espace client en sont exclues :
 * elles sont personnelles et marquées « noindex ».
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/velos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/equipement`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/personnalisation`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/a-propos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/livraison`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/confidentialite`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/retractation`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, universe: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${siteUrl}/produit/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories.map((category) => ({
        url: `${siteUrl}/${category.universe === "VELOS" ? "velos" : "equipement"}?categorie=${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Base indisponible au moment du build : on sert au moins les pages fixes.
    return staticRoutes;
  }
}
