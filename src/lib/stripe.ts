import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe côté serveur.
 *
 * La clé secrète ne quitte jamais le serveur : le navigateur ne reçoit que
 * la clé publiable et l'URL de la session de paiement. Aucun numéro de carte
 * ne transite par le site — la saisie a lieu sur les pages hébergées par
 * Stripe, ce qui limite d'autant le périmètre PCI DSS.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY absente : le paiement par carte est indisponible.",
    );
  }
  client = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}
