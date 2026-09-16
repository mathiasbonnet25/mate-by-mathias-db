import Link from "next/link";

import { AdminHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { emptyProductForm } from "@/lib/admin-product-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true, universe: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Nouveau produit"
        description="Renseignez la fiche, puis ajoutez autant de variantes que nécessaire."
        action={
          <Link
            href="/admin/produits"
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
          >
            ← Tous les produits
          </Link>
        }
      />
      <ProductEditor
        initial={emptyProductForm()}
        categories={categories}
        brands={brands}
      />
    </>
  );
}
