import Link from "next/link";
import type { Universe } from "@prisma/client";

import { FilterSidebar, FilterToolbar } from "@/components/shop/filters";
import { ProductCard } from "@/components/shop/product-card";
import { RevealGroup } from "@/components/ui/reveal";
import { getFilterFacets, listProducts } from "@/lib/catalog";

export type CatalogSearchParams = {
  categorie?: string;
  marque?: string;
  couleur?: string;
  taille?: string;
  prixMax?: string;
  dispo?: string;
  tri?: string;
  page?: string;
};

function split(value?: string): string[] | undefined {
  const parts = value?.split(",").map((v) => v.trim()).filter(Boolean);
  return parts?.length ? parts : undefined;
}

function toSort(value?: string) {
  const allowed = ["recent", "price-asc", "price-desc", "name"] as const;
  return allowed.includes(value as never)
    ? (value as (typeof allowed)[number])
    : "recent";
}

/**
 * Galerie de la boutique : filtres à gauche, produits à droite.
 * Les paramètres reçus de l'URL sont systématiquement nettoyés avant
 * d'atteindre la base.
 */
export async function CatalogView({
  universe,
  searchParams,
  basePath,
}: {
  universe: Universe;
  searchParams: CatalogSearchParams;
  basePath: string;
}) {
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const prixMax = Number.parseInt(searchParams.prixMax ?? "", 10);

  const [facets, result] = await Promise.all([
    getFilterFacets(universe),
    listProducts({
      universe,
      categorySlugs: split(searchParams.categorie),
      brandSlugs: split(searchParams.marque),
      colors: split(searchParams.couleur),
      sizes: split(searchParams.taille),
      maxPriceCents: Number.isFinite(prixMax) ? prixMax : undefined,
      inStockOnly: searchParams.dispo === "1",
      sort: toSort(searchParams.tri),
      page,
    }),
  ]);

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => Boolean(v)) as [string, string][],
    );
    params.set("page", String(target));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="container-page pb-28">
      {/* Barre d'outils au-dessus, puis panneau de filtres à gauche et
          produits à droite. */}
      <FilterToolbar facets={facets} total={result.total} />

      <div className="grid gap-x-14 lg:grid-cols-[250px_1fr]">
        <FilterSidebar facets={facets} />

        <div>
          <h2 className="sr-only">Produits</h2>

          {result.products.length === 0 ? (
            <div className="rounded-lg border border-line py-28 text-center">
              <p className="font-display text-2xl">Aucun produit ne correspond</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-foreground-muted">
                Essayez d&apos;élargir vos critères, ou composez directement
                votre projet à l&apos;atelier.
              </p>
              <Link
                href="/personnalisation"
                className="mt-8 inline-block rounded-full border border-line px-8 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
              >
                Atelier personnalisation
              </Link>
            </div>
          ) : (
            <RevealGroup className="grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-3">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </RevealGroup>
          )}

          {result.pageCount > 1 && (
            <nav
              className="mt-20 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {Array.from({ length: result.pageCount }).map((_, i) => {
                const target = i + 1;
                const current = target === result.page;
                return (
                  <Link
                    key={target}
                    href={buildPageHref(target)}
                    aria-current={current ? "page" : undefined}
                    className={`grid h-10 w-10 place-items-center border text-[12px] transition-colors ${
                      current
                        ? "border-accent bg-accent text-accent-contrast"
                        : "border-line hover:border-accent hover:text-accent"
                    }`}
                  >
                    {target}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
