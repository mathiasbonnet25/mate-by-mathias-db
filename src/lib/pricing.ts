import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Calculs monétaires. Tout est fait en centiers entiers : aucun arrondi
 * flottant ne peut faire diverger le total affiché du montant débité.
 */

export type CartLine = {
  variantId: string;
  quantity: number;
  unitPriceCents: number;
  vatRate: number;
  weightGrams: number;
};

export type CartTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  /** TVA incluse dans le total (les prix affichés sont TTC). */
  vatCents: number;
  totalCents: number;
  totalWeightGrams: number;
};

export function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
}

/**
 * Part de TVA contenue dans un montant TTC.
 * TVA = TTC − TTC / (1 + taux).
 */
export function vatFromGross(grossCents: number, vatRate: number): number {
  return Math.round(grossCents - grossCents / (1 + vatRate / 100));
}

export async function resolveDiscount(
  code: string | null | undefined,
  subtotalCents: number,
): Promise<{ discountCents: number; code: string | null; error?: string }> {
  if (!code) return { discountCents: 0, code: null };

  const promo = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!promo || !promo.isActive) {
    return { discountCents: 0, code: null, error: "Code promo inconnu." };
  }
  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) {
    return { discountCents: 0, code: null, error: "Ce code n'est pas encore actif." };
  }
  if (promo.endsAt && promo.endsAt < now) {
    return { discountCents: 0, code: null, error: "Ce code a expiré." };
  }
  if (promo.maxRedemptions && promo.redemptions >= promo.maxRedemptions) {
    return { discountCents: 0, code: null, error: "Ce code a atteint sa limite d'utilisation." };
  }
  if (promo.minSubtotalCents && subtotalCents < promo.minSubtotalCents) {
    return {
      discountCents: 0,
      code: null,
      error: `Ce code s'applique à partir de ${(promo.minSubtotalCents / 100).toFixed(2)} €.`,
    };
  }

  const discountCents =
    promo.type === "PERCENT"
      ? Math.round((subtotalCents * promo.value) / 100)
      : Math.min(promo.value, subtotalCents);

  return { discountCents, code: promo.code };
}

/**
 * Frais de port : on retient le tarif actif le moins cher compatible avec
 * la zone et le poids du panier, franco de port appliqué le cas échéant.
 */
export async function resolveShipping(
  zone: string,
  totalWeightGrams: number,
  subtotalAfterDiscountCents: number,
): Promise<{ shippingCents: number; label: string | null; estimate: string | null }> {
  const rates = await prisma.shippingRate.findMany({
    where: { isActive: true, zone },
    orderBy: [{ position: "asc" }, { priceCents: "asc" }],
  });

  const eligible = rates.filter((r) => {
    if (r.minWeightGrams != null && totalWeightGrams < r.minWeightGrams) return false;
    if (r.maxWeightGrams != null && totalWeightGrams > r.maxWeightGrams) return false;
    return true;
  });

  const rate = eligible[0];
  if (!rate) return { shippingCents: 0, label: null, estimate: null };

  const free =
    rate.freeAboveCents != null &&
    subtotalAfterDiscountCents >= rate.freeAboveCents;

  return {
    shippingCents: free ? 0 : rate.priceCents,
    label: free ? `${rate.name} — offert` : rate.name,
    estimate: rate.deliveryEstimate,
  };
}

export async function computeTotals(
  lines: CartLine[],
  options: { discountCode?: string | null; zone?: string } = {},
): Promise<CartTotals & { discountError?: string; shippingLabel: string | null }> {
  const subtotalCents = computeSubtotal(lines);
  const totalWeightGrams = lines.reduce(
    (sum, l) => sum + l.weightGrams * l.quantity,
    0,
  );

  const discount = await resolveDiscount(options.discountCode, subtotalCents);
  const afterDiscount = Math.max(0, subtotalCents - discount.discountCents);

  const shipping = await resolveShipping(
    options.zone ?? "FR",
    totalWeightGrams,
    afterDiscount,
  );

  // La remise est répartie au prorata pour ventiler correctement la TVA
  // par taux applicable.
  const vatCents = lines.reduce((sum, line) => {
    const lineGross = line.unitPriceCents * line.quantity;
    const share = subtotalCents === 0 ? 0 : lineGross / subtotalCents;
    const lineAfterDiscount = lineGross - discount.discountCents * share;
    return sum + vatFromGross(Math.round(lineAfterDiscount), line.vatRate);
  }, 0) + vatFromGross(shipping.shippingCents, 20);

  return {
    subtotalCents,
    discountCents: discount.discountCents,
    shippingCents: shipping.shippingCents,
    vatCents,
    totalCents: afterDiscount + shipping.shippingCents,
    totalWeightGrams,
    discountError: discount.error,
    shippingLabel: shipping.label,
  };
}
