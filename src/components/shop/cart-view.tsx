"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, Trash2, Tag } from "lucide-react";

import {
  applyDiscountAction,
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart";
import { formatPrice } from "@/lib/utils";
import type { CartView as CartViewData } from "@/lib/cart";
import { useRouter } from "next/navigation";

/**
 * Vrai lorsque la quantité demandée atteint le stock disponible. Le serveur
 * plafonne de toute façon la ligne ; l'indiquer ici évite un bouton qui
 * semble ne rien faire.
 */
function atMaxStock(item: { quantity: number; stock: number; allowBackorder: boolean }) {
  if (item.allowBackorder) return item.quantity >= 20;
  return item.quantity >= Math.min(item.stock, 20);
}

/**
 * Panier. Chaque modification passe par une action serveur qui revalide les
 * quantités et recalcule les totaux : le navigateur n'écrit jamais un prix.
 */
export function CartView({ cart }: { cart: CartViewData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(cart.discountCode ?? "");
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function mutate(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Opération impossible.");
      router.refresh();
    });
  }

  if (cart.items.length === 0) {
    return (
      <div className="border border-line py-28 text-center">
        <p className="font-display text-3xl">Votre panier est vide</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-foreground-muted">
          Parcourez la boutique ou composez directement votre projet à
          l&apos;atelier.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/velos"
            className="h-12 border border-line px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Cadres & Vélos
          </Link>
          <Link
            href="/personnalisation"
            className="h-12 bg-accent px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] text-accent-contrast transition-all hover:brightness-110"
          >
            Atelier personnalisation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <div>
        <ul className="divide-y divide-[var(--border)] border-y border-line">
          <AnimatePresence initial={false}>
            {cart.items.map((item) => (
              <motion.li
                key={item.id}
                layout
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-5 py-7"
              >
                <Link
                  href={`/produit/${item.productSlug}`}
                  className="relative aspect-square w-24 shrink-0 overflow-hidden bg-surface-muted sm:w-32"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/produit/${item.productSlug}`}
                        className="font-display text-xl transition-colors hover:text-accent"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-[13px] text-foreground-muted">
                        {item.variantLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground-muted">
                        Réf. {item.sku}
                      </p>
                      {item.stock <= 0 && item.allowBackorder && (
                        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-accent">
                          Sur commande
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-right text-sm">
                      {formatPrice(item.lineTotalCents)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          mutate(() =>
                            updateCartItemAction(item.id, item.quantity - 1),
                          )
                        }
                        aria-label={`Diminuer la quantité de ${item.productName}`}
                        className="grid h-10 w-10 place-items-center transition-colors hover:text-accent disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" aria-hidden />
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={pending || atMaxStock(item)}
                        onClick={() =>
                          mutate(() =>
                            updateCartItemAction(item.id, item.quantity + 1),
                          )
                        }
                        aria-label={`Augmenter la quantité de ${item.productName}`}
                        title={
                          atMaxStock(item)
                            ? "Quantité maximale disponible atteinte"
                            : undefined
                        }
                        className="grid h-10 w-10 place-items-center transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" aria-hidden />
                      </button>
                    </div>

                    {atMaxStock(item) && (
                      <p className="text-[11px] text-foreground-muted">
                        Quantité maximale disponible
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => mutate(() => removeCartItemAction(item.id))}
                      className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-red-500 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Retirer
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {error && (
          <p className="mt-4 text-[12px] text-red-500" role="alert">
            {error}
          </p>
        )}

        <Link
          href="/velos"
          className="mt-8 inline-block text-[11px] uppercase tracking-[0.16em] text-foreground-muted transition-colors hover:text-accent"
        >
          ← Poursuivre mes achats
        </Link>
      </div>

      {/* Récapitulatif */}
      <aside className="lg:sticky lg:top-[104px] lg:self-start">
        <div className="border border-line p-7">
          <h2 className="eyebrow">Récapitulatif</h2>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              setCodeMessage(null);
              startTransition(async () => {
                const result = await applyDiscountAction(code);
                setCodeMessage(
                  result.ok
                    ? "Code enregistré. Le montant est mis à jour ci-dessous."
                    : (result.error ?? "Code non appliqué."),
                );
                router.refresh();
              });
            }}
          >
            <label htmlFor="promo" className="sr-only">
              Code promotionnel
            </label>
            <div className="flex items-center border border-line focus-within:border-accent">
              <Tag className="ml-3 h-3.5 w-3.5 text-foreground-muted" aria-hidden />
              <input
                id="promo"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code promo"
                maxLength={40}
                className="h-11 w-full bg-transparent px-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-foreground-muted"
              />
              <button
                type="submit"
                disabled={pending}
                className="h-11 shrink-0 px-4 text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-accent disabled:opacity-40"
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  "Appliquer"
                )}
              </button>
            </div>
            {codeMessage && (
              <p className="mt-2 text-[11px] text-foreground-muted" role="status">
                {codeMessage}
              </p>
            )}
          </form>

          <dl className="mt-7 space-y-3 border-t border-line pt-6 text-sm">
            <Line label="Sous-total" value={formatPrice(cart.totals.subtotalCents)} />
            {cart.totals.discountCents > 0 && (
              <Line
                label={`Remise${cart.discountCode ? ` (${cart.discountCode})` : ""}`}
                value={`− ${formatPrice(cart.totals.discountCents)}`}
                accent
              />
            )}
            <Line
              label="Livraison estimée"
              value={
                cart.totals.shippingCents === 0
                  ? "Offerte"
                  : formatPrice(cart.totals.shippingCents)
              }
            />
            {cart.totals.shippingLabel && (
              <p className="text-[11px] text-foreground-muted">
                {cart.totals.shippingLabel}
              </p>
            )}
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-6">
            <span className="text-[11px] uppercase tracking-[0.16em]">
              Total TTC
            </span>
            <span className="font-display text-3xl">
              {formatPrice(cart.totals.totalCents)}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-foreground-muted">
            dont {formatPrice(cart.totals.vatCents)} de TVA
          </p>

          <Link
            href="/commande"
            className="mt-7 block h-13 bg-foreground py-4 text-center text-[11px] uppercase tracking-[0.18em] text-surface transition-all hover:bg-accent hover:text-accent-contrast"
          >
            Passer commande
          </Link>

          <p className="mt-5 text-[11px] leading-relaxed text-foreground-muted">
            Les frais de livraison définitifs sont calculés à l&apos;étape
            suivante, selon l&apos;adresse de livraison. Paiement sécurisé par
            carte bancaire, PayPal, Apple Pay ou Google Pay.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Line({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className={accent ? "text-accent" : undefined}>{value}</dd>
    </div>
  );
}
