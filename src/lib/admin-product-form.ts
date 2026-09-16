import "server-only";
import type { Prisma } from "@prisma/client";

import type { ProductFormData } from "@/components/admin/product-editor";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: { include: { images: true } };
  };
}>;

/** Valeurs d'un formulaire vierge. */
export function emptyProductForm(): ProductFormData {
  return {
    name: "",
    slug: "",
    tagline: "",
    description: "",
    universe: "VELOS",
    status: "DRAFT",
    categoryId: "",
    brandId: "",
    basePriceEuros: "",
    compareAtEuros: "",
    vatRate: "20",
    isFeatured: false,
    isMadeToOrder: false,
    weightGrams: "",
    specs: [],
    imageUrls: "",
    seoTitle: "",
    seoDescription: "",
    variants: [
      {
        sku: "",
        label: "",
        priceEuros: "",
        compareAtEuros: "",
        stock: "0",
        allowBackorder: false,
        colorName: "",
        colorHex: "",
        sizeName: "",
        weightGrams: "",
        isActive: true,
        imageUrls: "",
      },
    ],
  };
}

const centsToEuros = (cents: number | null): string =>
  cents == null ? "" : (cents / 100).toFixed(2);

/** Convertit un produit de la base vers l'état du formulaire. */
export function productToForm(product: ProductWithRelations): ProductFormData {
  const specs = Array.isArray(product.specs)
    ? (product.specs as unknown[]).flatMap((entry) =>
        entry && typeof entry === "object" && "label" in entry && "value" in entry
          ? [
              {
                label: String((entry as Record<string, unknown>).label),
                value: String((entry as Record<string, unknown>).value),
              },
            ]
          : [],
      )
    : [];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    tagline: product.tagline ?? "",
    description: product.description,
    universe: product.universe,
    status: product.status,
    categoryId: product.categoryId ?? "",
    brandId: product.brandId ?? "",
    basePriceEuros: centsToEuros(product.basePriceCents),
    compareAtEuros: centsToEuros(product.compareAtPriceCents),
    vatRate: String(product.vatRate),
    isFeatured: product.isFeatured,
    isMadeToOrder: product.isMadeToOrder,
    weightGrams: product.weightGrams == null ? "" : String(product.weightGrams),
    specs,
    imageUrls: product.images
      .filter((i) => i.variantId === null)
      .sort((a, b) => a.position - b.position)
      .map((i) => i.url)
      .join("\n"),
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    variants: product.variants
      .sort((a, b) => a.position - b.position)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        label: variant.label,
        priceEuros: centsToEuros(variant.priceCents),
        compareAtEuros: centsToEuros(variant.compareAtPriceCents),
        stock: String(variant.stock),
        allowBackorder: variant.allowBackorder,
        colorName: variant.colorName ?? "",
        colorHex: variant.colorHex ?? "",
        sizeName: variant.sizeName ?? "",
        weightGrams:
          variant.weightGrams == null ? "" : String(variant.weightGrams),
        isActive: variant.isActive,
        imageUrls: variant.images
          .sort((a, b) => a.position - b.position)
          .map((i) => i.url)
          .join("\n"),
      })),
  };
}
