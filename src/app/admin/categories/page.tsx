import Link from "next/link";

import { AdminHeader, Card } from "@/components/admin/ui";
import {
  CategoryManager,
  type CategoryRow,
} from "@/components/admin/category-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catégories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ univers?: string }>;
}) {
  const params = await searchParams;
  const universe =
    params.univers === "EQUIPEMENT" ? "EQUIPEMENT" : ("VELOS" as const);

  const categories = await prisma.category.findMany({
    where: { universe },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    universe: c.universe,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
    isActive: c.isActive,
    productCount: c._count.products,
  }));

  return (
    <>
      <AdminHeader
        title="Catégories"
        description="Organisez les rayons de la boutique. L'ordre défini ici est celui affiché sur le site."
      />

      <div className="mb-4 flex gap-2">
        {[
          { key: "VELOS", label: "Cadres & Vélos" },
          { key: "EQUIPEMENT", label: "Vêtements & Accessoires" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/categories?univers=${tab.key}`}
            className={`border px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              universe === tab.key
                ? "border-accent text-accent"
                : "border-line hover:border-accent"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CategoryManager
          key={universe}
          initial={rows}
          universe={universe}
        />
      </Card>
    </>
  );
}
