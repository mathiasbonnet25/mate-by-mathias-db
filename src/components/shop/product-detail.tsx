"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Minus, Plus, ShieldCheck, Truck, Undo2 } from "lucide-react";

import { ProductGallery, type GalleryImage } from "@/components/shop/product-gallery";
import { useCart } from "@/components/shop/cart-provider";
import { formatPrice } from "@/lib/utils";

export type VariantView = {
  id: string;
  sku: string;
  label: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  allowBackorder: boolean;
  colorName: string | null;
  colorHex: string | null;
  sizeName: string | null;
  images: GalleryImage[];
};

export type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  specs: { label: string; value: string }[];
  brandName: string | null;
  isMadeToOrder: boolean;
  baseImages: GalleryImage[];
  variants: VariantView[];
  deliveryEstimate: string;
};

/**
 * Bloc d'achat de la fiche produit.
 *
 * Le choix d'une couleur ou d'une taille sélectionne une variante précise :
 * les photos, le prix et le stock affichés proviennent alors de cette
 * variante. Le prix réellement facturé est toujours revérifié côté serveur.
 */
export function ProductDetail({ product }: { product: ProductDetailData }) {
  const router = useRouter();
  const { add } = useCart();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const colors = useMemo(
    () =>
      Array.from(
        new Map(
          product.variants
            .filter((v) => v.colorName)
            .map((v) => [v.colorName!, { name: v.colorName!, hex: v.colorHex }]),
        ).values(),
      ),
    [product.variants],
  );

  const [color, setColor] = useState<string | null>(colors[0]?.name ?? null);

  const sizesForColor = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .filter((v) => (color ? v.colorName === color : true))
            .map((v) => v.sizeName)
            .filter((s): s is string => Boolean(s)),
        ),
      ),
    [product.variants, color],
  );

  const [size, setSize] = useState<string | null>(sizesForColor[0] ?? null);

  const variant = useMemo(() => {
    const match = product.variants.find(
      (v) =>
        (color ? v.colorName === color : true) &&
        (size ? v.sizeName === size : true),
    );
    return match ?? product.variants[0] ?? null;
  }, [product.variants, color, size]);

  // Photos affichées : celles de la variante si elle en possède, sinon les
  // visuels génériques du produit.
  const galleryImages = useMemo(() => {
    const variantImages = variant?.images.filter((i) => !i.isSpin) ?? [];
    return variantImages.length > 0
      ? variantImages
      : product.baseImages.filter((i) => !i.isSpin);
  }, [variant, product.baseImages]);

  const spinImages = useMemo(
    () => [
      ...(variant?.images.filter((i) => i.isSpin) ?? []),
      ...product.baseImages.filter((i) => i.isSpin),
    ],
    [variant, product.baseImages],
  );

  const available = variant
    ? variant.stock > 0 || variant.allowBackorder
    : false;
  const lowStock = variant ? variant.stock > 0 && variant.stock <= 3 : false;
  const discounted =
    variant?.compareAtPriceCents != null &&
    variant.compareAtPriceCents > variant.priceCents;

  function handleAdd(then?: "checkout") {
    if (!variant) return;
    setError(null);
    startTransition(async () => {
      const ok = await add(variant.id, quantity);
      if (!ok) {
        setError("Ajout impossible. Vérifiez la disponibilité de cet article.");
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2600);
      if (then === "checkout") router.push("/commande");
    });
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
      <ProductGallery
        images={galleryImages}
        spinImages={spinImages}
        productName={product.name}
      />

      <div className="lg:sticky lg:top-[104px] lg:self-start">
        {product.brandName && (
          <p className="eyebrow">{product.brandName}</p>
        )}
        <h1 className="mt-3 text-balance font-display text-4xl leading-[1.08] md:text-5xl">
          {product.name}
        </h1>
        {product.tagline && (
          <p className="mt-4 text-base text-foreground-muted">{product.tagline}</p>
        )}

        <div className="mt-7 flex items-baseline gap-4">
          <span className="font-display text-3xl">
            {formatPrice(variant?.priceCents ?? 0)}
          </span>
          {discounted && (
            <span className="text-base text-foreground-muted line-through">
              {formatPrice(variant!.compareAtPriceCents!)}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-foreground-muted">
          Prix TTC, TVA française incluse. Frais de livraison calculés au panier.
        </p>

        {/* Couleur */}
        {colors.length > 0 && (
          <fieldset className="mt-10">
            <legend className="eyebrow">
              Couleur{color ? ` — ${color}` : ""}
            </legend>
            <div className="mt-4 flex flex-wrap gap-3">
              {colors.map((c) => {
                const active = c.name === color;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setColor(c.name);
                      // La taille courante peut ne pas exister dans la
                      // nouvelle couleur : on repositionne sur la première
                      // taille réellement disponible.
                      const nextSizes = product.variants
                        .filter((v) => v.colorName === c.name)
                        .map((v) => v.sizeName)
                        .filter((s): s is string => Boolean(s));
                      if (size && !nextSizes.includes(size)) {
                        setSize(nextSizes[0] ?? null);
                      }
                    }}
                    aria-pressed={active}
                    title={c.name}
                    className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-all duration-300 ${
                      active
                        ? "border-accent scale-110"
                        : "border-line hover:border-foreground-muted"
                    }`}
                  >
                    <span
                      className="h-7 w-7 rounded-full border border-line/40"
                      style={{ backgroundColor: c.hex ?? "transparent" }}
                    />
                    <span className="sr-only">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Taille */}
        {sizesForColor.length > 0 && (
          <fieldset className="mt-9">
            <div className="flex items-baseline justify-between">
              <legend className="eyebrow">Taille</legend>
              <Link
                href="/guide-des-tailles"
                className="text-[11px] text-foreground-muted underline underline-offset-4 hover:text-accent"
              >
                Guide des tailles
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sizesForColor.map((s) => {
                const candidate = product.variants.find(
                  (v) => v.sizeName === s && (color ? v.colorName === color : true),
                );
                const disabled =
                  !candidate ||
                  (candidate.stock <= 0 && !candidate.allowBackorder);
                const active = s === size;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSize(s)}
                    aria-pressed={active}
                    className={`h-11 min-w-14 border px-4 text-[12px] uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? "border-accent bg-accent text-accent-contrast"
                        : "border-line hover:border-accent"
                    } ${disabled ? "cursor-not-allowed line-through opacity-40" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Disponibilité */}
        <div className="mt-9 flex items-center gap-2.5 text-[13px]">
          <span
            className={`h-2 w-2 rounded-full ${
              available ? "bg-accent" : "bg-foreground-muted"
            }`}
            aria-hidden
          />
          <span className="text-foreground-muted">
            {product.isMadeToOrder
              ? "Fabriqué sur commande à l'atelier"
              : available
                ? lowStock
                  ? `Plus que ${variant!.stock} en stock`
                  : "En stock, expédié sous 48 h ouvrées"
                : "Actuellement indisponible"}
          </span>
        </div>

        {/* Quantité et achat */}
        <div className="mt-8 flex items-stretch gap-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
              className="grid h-12 w-11 place-items-center transition-colors hover:text-accent"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span
              className="w-9 text-center text-sm"
              aria-live="polite"
              aria-label={`Quantité : ${quantity}`}
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Augmenter la quantité"
              className="grid h-12 w-11 place-items-center transition-colors hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            disabled={!available || pending}
            onClick={() => handleAdd()}
            className="flex h-12 flex-1 items-center justify-center gap-2 bg-foreground text-[11px] uppercase tracking-[0.18em] text-surface transition-all duration-500 hover:bg-accent hover:text-accent-contrast disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AnimatePresence mode="wait" initial={false}>
              {pending ? (
                <motion.span key="loading" className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Ajout…
                </motion.span>
              ) : added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Ajouté au panier
                </motion.span>
              ) : (
                <motion.span key="idle">Ajouter au panier</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <button
          type="button"
          disabled={!available || pending}
          onClick={() => handleAdd("checkout")}
          className="mt-3 h-12 w-full border border-line text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Acheter maintenant
        </button>

        {error && (
          <p className="mt-3 text-[12px] text-red-500" role="alert">
            {error}
          </p>
        )}

        {/* Réassurance */}
        <ul className="mt-10 space-y-3.5 border-t border-line pt-8 text-[13px] text-foreground-muted">
          <li className="flex items-start gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>{product.deliveryEstimate}</span>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>
              Paiement sécurisé. Garantie légale de conformité de 2 ans et
              garantie contre les vices cachés.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Undo2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>
              {product.isMadeToOrder ? (
                <>
                  Article confectionné selon vos spécifications : le droit de
                  rétractation ne s&apos;applique pas (art. L221-28, 3° du code
                  de la consommation).{" "}
                  <Link href="/retractation" className="underline hover:text-accent">
                    En savoir plus
                  </Link>
                </>
              ) : (
                <>
                  14 jours pour changer d&apos;avis à compter de la réception.{" "}
                  <Link href="/retractation" className="underline hover:text-accent">
                    Droit de rétractation
                  </Link>
                </>
              )}
            </span>
          </li>
        </ul>

        {variant && (
          <p className="mt-6 text-[11px] text-foreground-muted">
            Référence : {variant.sku}
          </p>
        )}
      </div>
    </div>
  );
}
