import { Suspense } from "react";

import { PageIntro } from "@/components/shop/page-intro";
import { ProductCard } from "@/components/shop/product-card";
import { RevealGroup } from "@/components/ui/reveal";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Recherche",
  description: "Rechercher un produit dans la boutique Mate by Mathias.",
  path: "/recherche",
  noIndex: true,
});

async function searchProducts(query: string) {
  if (query.length < 2) return [];

  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { tagline: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    },
    take: 24,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      basePriceCents: true,
      compareAtPriceCents: true,
      isMadeToOrder: true,
      images: { orderBy: { position: "asc" }, take: 2, select: { url: true } },
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
    },
  });
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 120);
  const results = await searchProducts(query).catch(() => []);

  return (
    <>
      <PageIntro
        eyebrow="Boutique"
        title="Rechercher"
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Recherche", path: "/recherche" },
        ]}
      />

      <div className="container-page pb-28">
        <form method="get" className="max-w-xl">
          <label htmlFor="q" className="eyebrow">
            Votre recherche
          </label>
          <div className="mt-3 flex items-center border-b border-line focus-within:border-accent">
            <input
              id="q"
              name="q"
              defaultValue={query}
              autoFocus
              maxLength={120}
              placeholder="Cadre acier, casque, peinture candy…"
              className="h-13 w-full bg-transparent py-4 text-lg outline-none placeholder:text-foreground-muted"
            />
            <button
              type="submit"
              className="shrink-0 px-4 text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-accent"
            >
              Chercher
            </button>
          </div>
        </form>

        <div className="mt-16">
          <Suspense fallback={null}>
            {query.length < 2 ? (
              <p className="text-sm text-foreground-muted">
                Saisissez au moins deux caractères.
              </p>
            ) : results.length === 0 ? (
              <div className="border border-line py-24 text-center">
                <p className="font-display text-2xl">
                  Aucun résultat pour « {query} »
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm text-foreground-muted">
                  Essayez un terme plus général, ou composez directement votre
                  projet à l&apos;atelier.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-10 text-[11px] uppercase tracking-[0.16em] text-foreground-muted">
                  {results.length} résultat{results.length > 1 ? "s" : ""}
                </p>
                <RevealGroup className="grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-4">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={toCardData(product)} />
                  ))}
                </RevealGroup>
              </>
            )}
          </Suspense>
        </div>
      </div>
    </>
  );
}
