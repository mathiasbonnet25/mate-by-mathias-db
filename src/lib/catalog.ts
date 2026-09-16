import "server-only";
import type { Prisma, Universe } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/components/shop/product-card";

/** Champs nécessaires à la construction d'une carte produit. */
const cardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  basePriceCents: true,
  compareAtPriceCents: true,
  isMadeToOrder: true,
  images: {
    orderBy: { position: "asc" },
    take: 2,
    select: { url: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      priceCents: true,
      stock: true,
      allowBackorder: true,
      colorName: true,
      colorHex: true,
    },
  },
} satisfies Prisma.ProductSelect;

type ProductWithCardFields = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function toCardData(product: ProductWithCardFields): ProductCardData {
  const prices = product.variants
    .map((v) => v.priceCents ?? product.basePriceCents)
    .filter((p): p is number => typeof p === "number");

  const colors = Array.from(
    new Map(
      product.variants
        .filter((v) => v.colorName)
        .map((v) => [v.colorName!, { name: v.colorName!, hex: v.colorHex }]),
    ).values(),
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    priceCents: prices.length ? Math.min(...prices) : product.basePriceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    imageUrl: product.images[0]?.url ?? null,
    hoverImageUrl: product.images[1]?.url ?? null,
    colors,
    inStock: product.variants.some((v) => v.stock > 0 || v.allowBackorder),
    isMadeToOrder: product.isMadeToOrder,
  };
}

export async function getFeaturedProducts(limit = 4): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return products.map(toCardData);
}

export type CatalogFilters = {
  universe: Universe;
  categorySlugs?: string[];
  brandSlugs?: string[];
  colors?: string[];
  sizes?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly?: boolean;
  sort?: "recent" | "price-asc" | "price-desc" | "name";
  page?: number;
  perPage?: number;
};

export async function listProducts(filters: CatalogFilters) {
  const perPage = Math.min(filters.perPage ?? 24, 60);
  const page = Math.max(1, filters.page ?? 1);

  // Conditions portant sur les variantes : elles doivent toutes être
  // satisfaites par une même variante, d'où le `some` unique.
  const variantConditions: Prisma.ProductVariantWhereInput = { isActive: true };
  if (filters.colors?.length) {
    variantConditions.colorName = { in: filters.colors };
  }
  if (filters.sizes?.length) {
    variantConditions.sizeName = { in: filters.sizes };
  }
  if (filters.inStockOnly) {
    variantConditions.OR = [{ stock: { gt: 0 } }, { allowBackorder: true }];
  }

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    universe: filters.universe,
    ...(filters.categorySlugs?.length
      ? { category: { slug: { in: filters.categorySlugs } } }
      : {}),
    ...(filters.brandSlugs?.length
      ? { brand: { slug: { in: filters.brandSlugs } } }
      : {}),
    ...(filters.minPriceCents != null || filters.maxPriceCents != null
      ? {
          basePriceCents: {
            ...(filters.minPriceCents != null ? { gte: filters.minPriceCents } : {}),
            ...(filters.maxPriceCents != null ? { lte: filters.maxPriceCents } : {}),
          },
        }
      : {}),
    variants: { some: variantConditions },
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { basePriceCents: "asc" }
      : filters.sort === "price-desc"
        ? { basePriceCents: "desc" }
        : filters.sort === "name"
          ? { name: "asc" }
          : { publishedAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(toCardData),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Valeurs de filtres réellement présentes dans l'univers demandé. */
export async function getFilterFacets(universe: Universe) {
  const [categories, brands, variants, priceRange] = await Promise.all([
    prisma.category.findMany({
      where: { universe, isActive: true },
      orderBy: { position: "asc" },
      select: { slug: true, name: true, _count: { select: { products: true } } },
    }),
    prisma.brand.findMany({
      where: { products: { some: { universe, status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, product: { universe, status: "PUBLISHED" } },
      select: { colorName: true, colorHex: true, sizeName: true },
    }),
    prisma.product.aggregate({
      where: { universe, status: "PUBLISHED" },
      _min: { basePriceCents: true },
      _max: { basePriceCents: true },
    }),
  ]);

  const colors = Array.from(
    new Map(
      variants
        .filter((v) => v.colorName)
        .map((v) => [v.colorName!, { name: v.colorName!, hex: v.colorHex }]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const sizes = Array.from(
    new Set(variants.map((v) => v.sizeName).filter((s): s is string => Boolean(s))),
  ).sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));

  return {
    categories,
    brands,
    colors,
    sizes,
    minPriceCents: priceRange._min.basePriceCents ?? 0,
    maxPriceCents: priceRange._max.basePriceCents ?? 0,
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: { select: { name: true, slug: true, universe: true } },
      brand: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      videos: { orderBy: { position: "asc" } },
      options: {
        orderBy: { position: "asc" },
        include: { values: { orderBy: { position: "asc" } } },
      },
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: {
          images: { orderBy: { position: "asc" } },
          optionValues: { include: { optionValue: true } },
        },
      },
      reviews: {
        where: { isPublished: true },
        orderBy: { collectedAt: "desc" },
        take: 12,
      },
    },
  });
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  universe: Universe,
  limit = 4,
): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: productId },
      ...(categoryId ? { categoryId } : { universe }),
    },
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: cardSelect,
  });
  return products.map(toCardData);
}
