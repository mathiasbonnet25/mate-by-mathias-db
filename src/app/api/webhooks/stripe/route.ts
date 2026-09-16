import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { sendOrderConfirmation } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe.
 *
 * C'est la seule source de vérité du paiement : un retour de navigateur sur
 * la page de confirmation ne vaut pas encaissement. La signature est
 * vérifiée sur le corps brut de la requête ; sans elle, rien n'est traité.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Signature manquante." },
      { status: 400 },
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("[stripe] signature invalide", error);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (!orderId || session.payment_status !== "paid") break;

        const order = await markOrderPaid({
          orderId,
          provider: "STRIPE",
          providerRef:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? session.id),
          amountCents: session.amount_total ?? 0,
        });

        await sendOrderConfirmation({
          to: order.email,
          number: order.number,
          totalCents: order.totalCents,
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!paymentIntentId) break;

        const payment = await prisma.payment.findFirst({
          where: { providerRef: paymentIntentId },
        });
        if (!payment) break;

        const fullyRefunded = charge.amount_refunded >= charge.amount;
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              refundedCents: charge.amount_refunded,
              status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
              ...(fullyRefunded ? { status: "REFUNDED" as const } : {}),
              events: {
                create: {
                  status: fullyRefunded ? "REFUNDED" : "PAID",
                  message: fullyRefunded
                    ? "Commande remboursée."
                    : "Remboursement partiel effectué.",
                },
              },
            },
          }),
        ]);
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        await prisma.payment.updateMany({
          where: { providerRef: intent.id },
          data: { status: "FAILED" },
        });
        break;
      }

      default:
        // Les autres événements sont acquittés sans traitement.
        break;
    }
  } catch (error) {
    // On renvoie une erreur pour que Stripe rejoue l'événement : les
    // traitements sont idempotents, un rejeu est sans danger.
    console.error(`[stripe] traitement de ${event.type} impossible`, error);
    return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
