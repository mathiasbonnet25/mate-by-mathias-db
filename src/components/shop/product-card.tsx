"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

import { formatPrice } from "@/lib/utils";
import { revealItem } from "@/components/ui/reveal";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  colors: { name: string; hex: string | null }[];
  inStock: boolean;
  isMadeToOrder: boolean;
};

/**
 * Carte produit de la galerie. Au survol, la seconde photo se substitue à
 * la première par fondu ; les pastilles de couleur donnent un aperçu des
 * variantes disponibles sans quitter la liste.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const discounted =
    product.compareAtPriceCents != null &&
    product.compareAtPriceCents > product.priceCents;

  return (
    <motion.article variants={revealItem} className="group">
      <Link
        href={`/produit/${product.slug}`}
        className="block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-muted shadow-[var(--shadow-soft)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1.5 group-hover:shadow-[var(--shadow-lifted)]">
          {product.imageUrl ? (
            <>
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                className={`object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  hovered && product.hoverImageUrl
                    ? "scale-105 opacity-0"
                    : "scale-100 opacity-100"
                }`}
              />
              {product.hoverImageUrl && (
                <Image
                  src={product.hoverImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    hovered ? "scale-105 opacity-100" : "scale-100 opacity-0"
                  }`}
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
              Visuel à venir
            </div>
          )}

          <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-3">
            {discounted && (
              <span className="bg-accent px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-accent-contrast">
                Promotion
              </span>
            )}
            {product.isMadeToOrder && (
              <span className="bg-foreground px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-surface">
                Sur mesure
              </span>
            )}
            {!product.inStock && !product.isMadeToOrder && (
              <span className="rounded-full border border-line bg-surface/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]">
                Épuisé
              </span>
            )}
          </div>
        </div>

        <div className="px-1 pt-6">
          <h3 className="font-display text-lg leading-snug transition-colors duration-500 group-hover:text-accent">
            {product.name}
          </h3>
          {product.tagline && (
            <p className="mt-1 line-clamp-1 text-[13px] text-foreground-muted">
              {product.tagline}
            </p>
          )}

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-sm">{formatPrice(product.priceCents)}</span>
            {discounted && (
              <span className="text-[13px] text-foreground-muted line-through">
                {formatPrice(product.compareAtPriceCents!)}
              </span>
            )}
          </div>

          {product.colors.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              {product.colors.slice(0, 5).map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  className="h-3 w-3 rounded-full border border-line"
                  style={{ backgroundColor: color.hex ?? "transparent" }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-[11px] text-foreground-muted">
                  +{product.colors.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
