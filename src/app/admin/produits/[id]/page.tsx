import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { productToForm } from "@/lib/admin-product-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Modifier le produit" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: { include: { images: true } } },
    }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true, universe: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <>
      <AdminHeader
        title={product.name}
        description={`Dernière modification le ${product.updatedAt.toLocaleDateString("fr-FR")}`}
        action={
          <div className="flex gap-5">
            {product.status === "PUBLISHED" && (
              <Link
                href={`/produit/${product.slug}`}
                target="_blank"
                className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
              >
                Voir sur le site
              </Link>
            )}
            <Link
              href="/admin/produits"
              className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
            >
              ← Tous les produits
            </Link>
          </div>
        }
      />
      <ProductEditor
        initial={productToForm(product)}
        categories={categories}
        brands={brands}
      />
    </>
  );
}
