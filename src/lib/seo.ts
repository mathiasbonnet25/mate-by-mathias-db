import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";

export const BRAND = "Mate by Mathias";
export const TAGLINE = "Peinture et restauration de vélos sur mesure";

/**
 * Fabrique de métadonnées : titres, description, Open Graph et canonique.
 * Chaque page doit fournir au minimum un titre et une description propres.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
  type = "website",
}: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article" | "product";
}): Metadata {
  const url = `${siteUrl}${path}`;
  const ogImage = image ?? `${siteUrl}/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      title: `${title} — ${BRAND}`,
      description,
      url,
      siteName: BRAND,
      locale: "fr_FR",
      type: type === "product" ? "website" : type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${BRAND}`,
      description,
      images: [ogImage],
    },
  };
}

/** Données structurées de l'organisation, injectées sur toutes les pages. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND,
    description: TAGLINE,
    url: siteUrl,
    image: `${siteUrl}/og-default.jpg`,
    priceRange: "€€€",
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
    sameAs: [
      "https://instagram.com/matebymathias",
      "https://facebook.com/matebymathias",
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  slug: string;
  image: string | null;
  priceCents: number;
  inStock: boolean;
  brand?: string | null;
  sku?: string | null;
  ratingValue?: number | null;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.slice(0, 500),
    image: product.image ? [product.image] : undefined,
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: product.brand ?? BRAND },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produit/${product.slug}`,
      priceCurrency: "EUR",
      price: (product.priceCents / 100).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating:
      product.ratingValue && product.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratingValue.toFixed(1),
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Sérialisation sûre d'un JSON-LD injecté dans une balise <script>. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
