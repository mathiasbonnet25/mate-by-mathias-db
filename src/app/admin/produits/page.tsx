import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { AdminHeader, Card, EmptyState, Badge } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Produits" };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; univers?: string; statut?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120);

  const where: Prisma.ProductWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(params.univers === "VELOS" || params.univers === "EQUIPEMENT"
      ? { universe: params.univers }
      : {}),
    ...(params.statut && STATUS_LABELS[params.statut]
      ? { status: params.statut as never }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: {
        where: { isActive: true },
        select: { stock: true, allowBackorder: true },
      },
    },
  });

  return (
    <>
      <AdminHeader
        title="Produits"
        description="Créez et modifiez les fiches produit, leurs variantes, leurs photos et leurs stocks."
        action={
          <Link
            href="/admin/produits/nouveau"
            className="inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nouveau produit
          </Link>
        }
      />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-4" method="get">
          <label className="min-w-56 flex-1">
            <span className="eyebrow">Recherche</span>
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Nom, adresse ou référence"
              className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            />
          </label>

          <label>
            <span className="eyebrow">Univers</span>
            <select
              name="univers"
              defaultValue={params.univers ?? ""}
              className="mt-2 h-11 rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            >
              <option value="">Tous</option>
              <option value="VELOS">Cadres &amp; Vélos</option>
              <option value="EQUIPEMENT">Vêtements &amp; Accessoires</option>
            </select>
          </label>

          <label>
            <span className="eyebrow">Statut</span>
            <select
              name="statut"
              defaultValue={params.statut ?? ""}
              className="mt-2 h-11 rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            >
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="h-11 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Filtrer
          </button>
        </form>
      </Card>

      <Card>
        {products.length === 0 ? (
          <EmptyState message="Aucun produit. Commencez par en créer un." />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {products.map((product) => {
              const stock = product.variants.reduce((s, v) => s + v.stock, 0);
              const backorder = product.variants.some((v) => v.allowBackorder);

              return (
                <li key={product.id}>
                  <Link
                    href={`/admin/produits/${product.id}`}
                    className="flex flex-wrap items-center gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-surface-muted">
                      {product.images[0] && (
                        <Image
                          src={product.images[0].url}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </span>

                    <span className="min-w-48 flex-1">
                      <span className="block text-sm">{product.name}</span>
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {product.category?.name ?? "Sans catégorie"} ·{" "}
                        {product.variants.length} variante
                        {product.variants.length > 1 ? "s" : ""}
                      </span>
                    </span>

                    <Badge
                      tone={
                        product.status === "PUBLISHED"
                          ? "success"
                          : product.status === "ARCHIVED"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {STATUS_LABELS[product.status]}
                    </Badge>

                    {product.isFeatured && <Badge tone="accent">Mis en avant</Badge>}

                    <span
                      className={`w-20 text-right text-[12px] ${
                        stock === 0 && !backorder
                          ? "text-red-500"
                          : "text-foreground-muted"
                      }`}
                    >
                      {stock === 0 && backorder ? "Sur commande" : `${stock} en stock`}
                    </span>

                    <span className="w-24 text-right text-[13px]">
                      {formatPrice(product.basePriceCents)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
