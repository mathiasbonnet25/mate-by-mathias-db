import "server-only";
import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeTotals, type CartLine } from "@/lib/pricing";
import { nextSequenceNumber } from "@/lib/numbering";

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  company?: string | null;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
};

/**
 * Crée la commande à partir d'un panier.
 *
 * Tout est recalculé ici : prix unitaires, disponibilité, remise et frais de
 * port. Le total renvoyé fait autorité et sert de base au montant demandé au
 * prestataire de paiement.
 */
export async function createOrderFromCart(params: {
  cartToken: string;
  email: string;
  phone?: string | null;
  shipping: CheckoutAddress;
  billing?: CheckoutAddress | null;
  userId?: string | null;
  customerNote?: string | null;
  withdrawalWaived?: boolean;
}) {
  const cart = await prisma.cart.findUnique({
    where: { token: params.cartToken },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              images: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Votre panier est vide.");
  }

  // Contrôle de disponibilité avant d'engager le paiement.
  for (const item of cart.items) {
    const v = item.variant;
    if (!v.isActive || v.product.status !== "PUBLISHED") {
      throw new Error(`« ${v.product.name} » n'est plus disponible.`);
    }
    if (!v.allowBackorder && v.stock < item.quantity) {
      throw new Error(
        `Stock insuffisant pour « ${v.product.name} » (${v.label}).`,
      );
    }
  }

  const lines: CartLine[] = cart.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPriceCents:
      item.variant.priceCents ?? item.variant.product.basePriceCents,
    vatRate: item.variant.product.vatRate,
    weightGrams:
      item.variant.weightGrams ?? item.variant.product.weightGrams ?? 500,
  }));

  const zone = params.shipping.country === "FR" ? "FR" : "EU";
  const totals = await computeTotals(lines, {
    discountCode: cart.discountCode,
    zone,
  });

  const number = await nextSequenceNumber("order", "MBM");

  const shippingAddress = await prisma.address.create({
    data: { ...params.shipping, type: "SHIPPING", userId: params.userId ?? null },
  });

  const billingAddress = params.billing
    ? await prisma.address.create({
        data: { ...params.billing, type: "BILLING", userId: params.userId ?? null },
      })
    : null;

  const itemsData: Prisma.OrderItemCreateManyOrderInput[] = cart.items.map(
    (item) => {
      const unitPriceCents =
        item.variant.priceCents ?? item.variant.product.basePriceCents;
      return {
        productId: item.variant.productId,
        variantId: item.variantId,
        name: item.variant.product.name,
        variantLabel: item.variant.label,
        sku: item.variant.sku,
        imageUrl: item.variant.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPriceCents,
        vatRate: item.variant.product.vatRate,
        totalCents: unitPriceCents * item.quantity,
      };
    },
  );

  const order = await prisma.order.create({
    data: {
      number,
      userId: params.userId ?? null,
      email: params.email.toLowerCase(),
      phone: params.phone ?? null,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress?.id ?? shippingAddress.id,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      shippingCents: totals.shippingCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      discountCode: cart.discountCode,
      customerNote: params.customerNote ?? null,
      cartToken: cart.token,
      withdrawalWaived: params.withdrawalWaived ?? false,
      items: { createMany: { data: itemsData } },
      events: {
        create: {
          status: "PENDING_PAYMENT",
          message: "Commande enregistrée, en attente de paiement.",
        },
      },
    },
    include: { items: true },
  });

  return order;
}

/**
 * Confirme le paiement : décrémente le stock, incrémente le compteur du code
 * promo et émet la facture. Idempotent — un webhook rejoué ne produit pas
 * d'effet supplémentaire.
 */
export async function markOrderPaid(params: {
  orderId: string;
  provider: "STRIPE" | "PAYPAL";
  providerRef: string;
  amountCents: number;
  cardBrand?: string | null;
  cardLast4?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Commande introuvable.");
    if (order.paymentStatus === "PAID") return order;

    if (order.totalCents !== params.amountCents) {
      // Le montant encaissé doit correspondre exactement au total calculé.
      throw new Error(
        `Montant incohérent pour ${order.number} : attendu ${order.totalCents}, reçu ${params.amountCents}.`,
      );
    }

    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    if (order.discountCode) {
      await tx.discountCode.updateMany({
        where: { code: order.discountCode },
        data: { redemptions: { increment: 1 } },
      });
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: params.provider,
        status: "PAID",
        providerRef: params.providerRef,
        amountCents: params.amountCents,
        cardBrand: params.cardBrand ?? null,
        cardLast4: params.cardLast4 ?? null,
      },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        events: {
          create: {
            status: "PAID",
            message: "Paiement confirmé. La commande part en production.",
          },
        },
      },
      include: { items: true },
    });

    // Vider le panier d'origine, et lui seul.
    if (order.cartToken) {
      await tx.cart.deleteMany({ where: { token: order.cartToken } });
    }

    return updated;
  });
}

/** Libellés français des statuts, partagés par l'admin et l'espace client. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  IN_PRODUCTION: "En préparation",
  PAINTING: "En peinture",
  PACKING: "Emballage",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

/** Colonnes du planning de production affiché sur le tableau de bord. */
export const PRODUCTION_COLUMNS: OrderStatus[] = [
  "PAID",
  "IN_PRODUCTION",
  "PAINTING",
  "PACKING",
  "SHIPPED",
  "DELIVERED",
];
