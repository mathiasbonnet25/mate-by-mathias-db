import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getCartToken } from "@/lib/cart";
import { createOrderFromCart } from "@/lib/orders";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().max(120).optional().nullable(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().length(2),
  phone: z.string().trim().max(40).optional().nullable(),
});

const schema = z.object({
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  shipping: addressSchema,
  billing: addressSchema.optional().nullable(),
  customerNote: z.string().trim().max(1000).optional().nullable(),
  /// Acceptation explicite des CGV, exigée avant toute commande.
  acceptsTerms: z.literal(true),
  /// Renonciation au droit de rétractation pour les biens personnalisés.
  withdrawalWaived: z.boolean().optional(),
});

/**
 * Création de la commande puis ouverture d'une session de paiement Stripe.
 *
 * Le montant transmis à Stripe provient exclusivement du total recalculé en
 * base : le navigateur n'envoie ni prix ni quantité.
 */
export async function POST(request: Request) {
  const ip = await getClientIp();
  const limit = await rateLimit(`checkout:${hashIp(ip) ?? "unknown"}`, 10, 600);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Merci de patienter quelques minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Merci de vérifier les informations saisies." },
      { status: 400 },
    );
  }

  const cartToken = await getCartToken();
  if (!cartToken) {
    return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
  }

  const session = await auth();

  try {
    const order = await createOrderFromCart({
      cartToken,
      email: parsed.data.email,
      phone: parsed.data.phone,
      shipping: parsed.data.shipping,
      billing: parsed.data.billing ?? null,
      userId: session?.user?.id ?? null,
      customerNote: parsed.data.customerNote,
      withdrawalWaived: parsed.data.withdrawalWaived,
    });

    if (!isStripeConfigured()) {
      // Sans clés Stripe (développement), la commande existe mais reste en
      // attente de paiement : on renvoie vers la page de suivi.
      return NextResponse.json({
        orderNumber: order.number,
        url: `/commande/confirmation?commande=${order.number}&paiement=indisponible`,
      });
    }

    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      // Apple Pay et Google Pay apparaissent automatiquement via « card »
      // dès que le domaine est vérifié dans le tableau de bord Stripe.
      payment_method_types: ["card", "paypal"],
      customer_email: order.email,
      client_reference_id: order.id,
      locale: "fr",
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.name,
            description: item.variantLabel ?? undefined,
            images: item.imageUrl ? [item.imageUrl] : undefined,
          },
        },
      })),
      // Remise et livraison sont exprimées comme des lignes dédiées pour que
      // le total Stripe soit strictement égal au total calculé en base.
      discounts: order.discountCents
        ? [
            {
              coupon: (
                await stripe().coupons.create({
                  amount_off: order.discountCents,
                  currency: "eur",
                  duration: "once",
                  name: order.discountCode ?? "Remise",
                })
              ).id,
            },
          ]
        : undefined,
      shipping_options: order.shippingCents
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                display_name: "Livraison",
                fixed_amount: { amount: order.shippingCents, currency: "eur" },
              },
            },
          ]
        : undefined,
      metadata: { orderId: order.id, orderNumber: order.number },
      success_url: `${siteUrl}/commande/confirmation?commande=${order.number}`,
      cancel_url: `${siteUrl}/panier?paiement=annule`,
    });

    return NextResponse.json({ orderNumber: order.number, url: checkout.url });
  } catch (error) {
    console.error("[checkout] échec", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "La commande n'a pas pu être créée.",
      },
      { status: 400 },
    );
  }
}
