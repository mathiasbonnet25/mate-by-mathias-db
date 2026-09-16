"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export type CatalogResult = { ok: boolean; error?: string; id?: string };

/**
 * Gestion du catalogue depuis l'administration.
 *
 * Les prix sont saisis en euros dans l'interface et convertis en centiers
 * ici : aucune valeur monétaire flottante n'atteint la base.
 */

const variantSchema = z.object({
  id: z.string().max(60).optional(),
  sku: z.string().trim().min(1, "Référence obligatoire.").max(80),
  label: z.string().trim().min(1).max(160),
  priceEuros: z.number().min(0).max(1_000_000).nullable(),
  compareAtEuros: z.number().min(0).max(1_000_000).nullable(),
  stock: z.number().int().min(0).max(100_000),
  allowBackorder: z.boolean(),
  colorName: z.string().trim().max(80).nullable(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur au format #RRGGBB.")
    .nullable()
    .or(z.literal("")),
  sizeName: z.string().trim().max(40).nullable(),
  weightGrams: z.number().int().min(0).max(200_000).nullable(),
  isActive: z.boolean(),
  imageUrls: z.array(z.string().trim().max(600)).max(20),
});

const productSchema = z.object({
  id: z.string().max(60).optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(200),
  slug: z.string().trim().max(200).optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().min(1, "La description est obligatoire.").max(20_000),
  universe: z.enum(["VELOS", "EQUIPEMENT"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  categoryId: z.string().max(60).nullable(),
  brandId: z.string().max(60).nullable(),
  basePriceEuros: z.number().min(0).max(1_000_000),
  compareAtEuros: z.number().min(0).max(1_000_000).nullable(),
  vatRate: z.number().int().min(0).max(100),
  isFeatured: z.boolean(),
  isMadeToOrder: z.boolean(),
  weightGrams: z.number().int().min(0).max(200_000).nullable(),
  specs: z
    .array(
      z.object({
        label: z.string().trim().max(120),
        value: z.string().trim().max(400),
      }),
    )
    .max(40),
  imageUrls: z.array(z.string().trim().max(600)).max(30),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(400).optional(),
  variants: z.array(variantSchema).min(1, "Au moins une variante est requise."),
});

const euros = (value: number | null) =>
  value == null ? null : Math.round(value * 100);

export async function saveProduct(input: unknown): Promise<CatalogResult> {
  const staff = await requireStaff();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  // Une référence en double casserait le suivi des stocks et des commandes.
  const skus = data.variants.map((v) => v.sku.trim());
  if (new Set(skus).size !== skus.length) {
    return { ok: false, error: "Deux variantes portent la même référence." };
  }

  try {
    const conflicting = await prisma.product.findFirst({
      where: { slug, ...(data.id ? { id: { not: data.id } } : {}) },
      select: { id: true },
    });
    if (conflicting) {
      return {
        ok: false,
        error: "Cette adresse (slug) est déjà utilisée par un autre produit.",
      };
    }

    const base = {
      name: data.name,
      slug,
      tagline: data.tagline || null,
      description: data.description,
      universe: data.universe,
      status: data.status,
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      basePriceCents: Math.round(data.basePriceEuros * 100),
      compareAtPriceCents: euros(data.compareAtEuros),
      vatRate: data.vatRate,
      isFeatured: data.isFeatured,
      isMadeToOrder: data.isMadeToOrder,
      weightGrams: data.weightGrams,
      specs: data.specs,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    };

    const productId = await prisma.$transaction(async (tx) => {
      const product = data.id
        ? await tx.product.update({ where: { id: data.id }, data: base })
        : await tx.product.create({ data: base });

      // Les variantes absentes du formulaire sont désactivées plutôt que
      // supprimées : une commande passée doit rester lisible.
      const keptIds = data.variants
        .map((v) => v.id)
        .filter((id): id is string => Boolean(id));

      await tx.productVariant.updateMany({
        where: { productId: product.id, id: { notIn: keptIds } },
        data: { isActive: false },
      });

      for (const [index, variant] of data.variants.entries()) {
        const variantData = {
          productId: product.id,
          sku: variant.sku.trim(),
          label: variant.label,
          priceCents: euros(variant.priceEuros),
          compareAtPriceCents: euros(variant.compareAtEuros),
          stock: variant.stock,
          allowBackorder: variant.allowBackorder,
          colorName: variant.colorName || null,
          colorHex: variant.colorHex || null,
          sizeName: variant.sizeName || null,
          weightGrams: variant.weightGrams,
          isActive: variant.isActive,
          position: index,
        };

        const saved = variant.id
          ? await tx.productVariant.update({
              where: { id: variant.id },
              data: variantData,
            })
          : await tx.productVariant.create({ data: variantData });

        // Photos propres à la variante : c'est ce qui permet de changer
        // toutes les images quand le client change de couleur.
        await tx.productImage.deleteMany({ where: { variantId: saved.id } });
        if (variant.imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: variant.imageUrls.map((url, i) => ({
              productId: product.id,
              variantId: saved.id,
              url,
              alt: `${data.name} — ${variant.label}`,
              position: i,
            })),
          });
        }
      }

      // Visuels génériques du produit (non rattachés à une variante).
      await tx.productImage.deleteMany({
        where: { productId: product.id, variantId: null },
      });
      if (data.imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: data.imageUrls.map((url, i) => ({
            productId: product.id,
            url,
            alt: data.name,
            position: i,
          })),
        });
      }

      return product.id;
    });

    await logAudit({
      action: data.id ? "product.update" : "product.create",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Product",
      entityId: productId,
      diff: { name: data.name, status: data.status },
    });

    revalidatePath("/admin/produits");
    revalidatePath(`/produit/${slug}`);
    revalidatePath(data.universe === "VELOS" ? "/velos" : "/equipement");
    revalidatePath("/");

    return { ok: true, id: productId };
  } catch (error) {
    console.error("[admin] enregistrement du produit impossible", error);
    return { ok: false, error: "Le produit n'a pas pu être enregistré." };
  }
}

export async function setProductStatus(
  productId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): Promise<CatalogResult> {
  const staff = await requireStaff();
  if (typeof productId !== "string") {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
      select: { slug: true, universe: true },
    });

    await logAudit({
      action: "product.status_change",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Product",
      entityId: productId,
      diff: { status },
    });

    revalidatePath("/admin/produits");
    revalidatePath(`/produit/${product.slug}`);
    revalidatePath(product.universe === "VELOS" ? "/velos" : "/equipement");
    return { ok: true };
  } catch {
    return { ok: false, error: "Modification impossible." };
  }
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  id: z.string().max(60).optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(120),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  universe: z.enum(["VELOS", "EQUIPEMENT"]),
  imageUrl: z.string().trim().max(600).optional(),
  parentId: z.string().max(60).nullable(),
  isActive: z.boolean(),
});

export async function saveCategory(input: unknown): Promise<CatalogResult> {
  const staff = await requireStaff();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  // Une catégorie ne peut pas être son propre parent.
  if (data.id && data.parentId === data.id) {
    return { ok: false, error: "Une catégorie ne peut pas être son parent." };
  }

  try {
    const base = {
      name: data.name,
      slug,
      description: data.description || null,
      universe: data.universe,
      imageUrl: data.imageUrl || null,
      parentId: data.parentId || null,
      isActive: data.isActive,
    };

    const category = data.id
      ? await prisma.category.update({ where: { id: data.id }, data: base })
      : await prisma.category.create({
          data: {
            ...base,
            position: await prisma.category.count({
              where: { universe: data.universe },
            }),
          },
        });

    await logAudit({
      action: data.id ? "category.update" : "category.create",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Category",
      entityId: category.id,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/velos");
    revalidatePath("/equipement");
    return { ok: true, id: category.id };
  } catch (error) {
    console.error("[admin] enregistrement de la catégorie impossible", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

export async function deleteCategory(categoryId: string): Promise<CatalogResult> {
  const staff = await requireStaff();
  if (typeof categoryId !== "string") {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    const productCount = await prisma.product.count({ where: { categoryId } });
    if (productCount > 0) {
      return {
        ok: false,
        error: `Cette catégorie contient ${productCount} produit(s). Déplacez-les avant de la supprimer.`,
      };
    }

    await prisma.category.delete({ where: { id: categoryId } });

    await logAudit({
      action: "category.delete",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Category",
      entityId: categoryId,
      severity: "WARNING",
    });

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

/** Réordonne les catégories après un glisser-déposer. */
export async function reorderCategories(
  orderedIds: string[],
): Promise<CatalogResult> {
  const staff = await requireStaff();
  if (!Array.isArray(orderedIds) || orderedIds.length > 200) {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({ where: { id }, data: { position: index } }),
      ),
    );

    await logAudit({
      action: "category.reorder",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Category",
    });

    revalidatePath("/admin/categories");
    revalidateTag("content");
    return { ok: true };
  } catch {
    return { ok: false, error: "Réorganisation impossible." };
  }
}
