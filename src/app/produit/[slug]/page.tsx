import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductDetail, type ProductDetailData } from "@/components/shop/product-detail";
import { ProductCard } from "@/components/shop/product-card";
import { Reviews, type ReviewData } from "@/components/home/reviews";
import { Section } from "@/components/ui/section";
import { Reveal, RevealGroup } from "@/components/ui/reveal";

import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  productJsonLd,
} from "@/lib/seo";

export const revalidate = 180;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return buildMetadata({
      title: "Produit introuvable",
      description: "Ce produit n'est plus disponible.",
      path: `/produit/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description:
      product.seoDescription ??
      product.tagline ??
      product.description.slice(0, 160),
    path: `/produit/${product.slug}`,
    image: product.images[0]?.url ?? null,
    type: "product",
  });
}

function parseSpecs(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      "label" in entry &&
      "value" in entry
    ) {
      return [
        {
          label: String((entry as Record<string, unknown>).label),
          value: String((entry as Record<string, unknown>).value),
        },
      ];
    }
    return [];
  });
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const related = await getRelatedProducts(
    product.id,
    product.categoryId,
    product.universe,
  ).catch(() => []);

  const universePath = product.universe === "VELOS" ? "/velos" : "/equipement";
  const universeName =
    product.universe === "VELOS" ? "Cadres & Vélos" : "Vêtements & Accessoires";

  const detail: ProductDetailData = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    specs: parseSpecs(product.specs),
    brandName: product.brand?.name ?? null,
    isMadeToOrder: product.isMadeToOrder,
    baseImages: product.images
      .filter((img) => img.variantId === null)
      .map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isSpin: img.isSpin,
      })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.label,
      priceCents: v.priceCents ?? product.basePriceCents,
      compareAtPriceCents: v.compareAtPriceCents ?? product.compareAtPriceCents,
      stock: v.stock,
      allowBackorder: v.allowBackorder,
      colorName: v.colorName,
      colorHex: v.colorHex,
      sizeName: v.sizeName,
      images: v.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isSpin: img.isSpin,
      })),
    })),
    deliveryEstimate: product.isMadeToOrder
      ? "Délai de réalisation communiqué à la commande, généralement 3 à 6 semaines."
      : "Livraison en France sous 2 à 4 jours ouvrés. Expédition suivie et assurée.",
  };

  const reviews: ReviewData[] = product.reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    collectedAt: r.collectedAt.toISOString(),
    isVerifiedPurchase: r.isVerifiedPurchase,
  }));

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const minPrice = Math.min(
    ...detail.variants.map((v) => v.priceCents),
    product.basePriceCents,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            productJsonLd({
              name: product.name,
              description: product.description,
              slug: product.slug,
              image: product.images[0]?.url ?? null,
              priceCents: minPrice,
              inStock: detail.variants.some(
                (v) => v.stock > 0 || v.allowBackorder,
              ),
              brand: product.brand?.name ?? null,
              sku: detail.variants[0]?.sku ?? null,
              ratingValue: averageRating,
              reviewCount: reviews.length,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Accueil", path: "/" },
              { name: universeName, path: universePath },
              { name: product.name, path: `/produit/${product.slug}` },
            ]),
          ),
        }}
      />

      <div className="container-page pb-8 pt-[132px] md:pt-[168px]">
        <nav aria-label="Fil d'Ariane" className="mb-10">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
            <li>
              <a href="/" className="hover:text-accent">
                Accueil
              </a>
            </li>
            <li aria-hidden>/</li>
            <li>
              <a href={universePath} className="hover:text-accent">
                {universeName}
              </a>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              {product.name}
            </li>
          </ol>
        </nav>

        <ProductDetail product={detail} />
      </div>

      {/* Description et caractéristiques */}
      <Section muted>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <h2 className="font-display text-3xl">Description</h2>
            <div className="mt-6 space-y-4 text-[15px] leading-[1.85] text-foreground-muted">
              {product.description.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>

          {detail.specs.length > 0 && (
            <Reveal delay={0.1}>
              <h2 className="font-display text-3xl">Caractéristiques</h2>
              <dl className="mt-6 divide-y divide-[var(--border)] border-y border-line">
                {detail.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-6 py-4"
                  >
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
                      {spec.label}
                    </dt>
                    <dd className="text-right text-sm">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </Section>

      {reviews.length > 0 && (
        <Section title="Avis clients">
          <RevealGroup>
            <Reviews reviews={reviews} />
          </RevealGroup>
        </Section>
      )}

      {related.length > 0 && (
        <Section muted title="À découvrir également">
          <RevealGroup className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </RevealGroup>
        </Section>
      )}
    </>
  );
}
