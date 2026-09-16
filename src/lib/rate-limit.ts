import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Limitation de débit persistée en base.
 *
 * Utilisée sur les points sensibles : connexion, inscription, formulaires
 * publics, vérification 2FA, demandes de devis. Le stockage en base (plutôt
 * qu'en mémoire) garantit que la limite reste effective malgré le caractère
 * sans état des fonctions serverless.
 */
export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const existing = await prisma.rateLimitCounter.findUnique({ where: { key } });

  if (!existing || existing.expiresAt < now) {
    await prisma.rateLimitCounter.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    });
    return { success: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  const updated = await prisma.rateLimitCounter.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    success: true,
    remaining: Math.max(0, limit - updated.count),
    retryAfterSeconds: 0,
  };
}

/** Purge des compteurs expirés, à appeler depuis une tâche planifiée. */
export async function purgeExpiredRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimitCounter.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
