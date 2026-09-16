import { z } from "zod";

/**
 * Validation des variables d'environnement au démarrage.
 * Un secret manquant doit faire échouer le build plutôt que de dégrader
 * silencieusement la sécurité en production.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  ENCRYPTION_KEY: z.string().optional(),
  IP_HASH_SALT: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(["sandbox", "live"]).default("sandbox"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Mate by Mathias <contact@matebymathias.fr>"),
  EMAIL_CONTACT: z.string().default("contact@matebymathias.fr"),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Variables d'environnement invalides ou manquantes : ${missing}. ` +
        `Voir .env.example.`,
    );
  }
  cached = parsed.data;
  return cached;
}

/** URL publique du site, utilisée pour les liens absolus et le SEO. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const isProduction = process.env.NODE_ENV === "production";
