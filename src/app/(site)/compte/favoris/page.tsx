import Link from "next/link";

import { ProductCard } from "@/components/shop/product-card";
import { RevealGroup } from "@/components/ui/reveal";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mes favoris",
  description: "Vos produits favoris.",
  path: "/compte/favoris",
  noIndex: true,
});

export default async function FavorisPage() {
  const session = await auth();

  const favorites = await prisma.favorite.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
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
      },
    },
  });

  if (favorites.length === 0) {
    return (
      <div className="border border-line p-12 text-center">
        <p className="font-display text-2xl">Aucun favori</p>
        <p className="mt-3 text-sm text-foreground-muted">
          Ajoutez des produits à vos favoris pour les retrouver ici.
        </p>
        <Link
          href="/velos"
          className="mt-8 inline-block border border-line px-7 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
        >
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <RevealGroup className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
      {favorites.map((favorite) => (
        <ProductCard
          key={favorite.productId}
          product={toCardData(favorite.product)}
        />
      ))}
    </RevealGroup>
  );
}
