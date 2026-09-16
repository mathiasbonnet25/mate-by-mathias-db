"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { verifyPassword, hashPassword, assessPassword } from "@/lib/password";
import {
  buildOtpAuthUrl,
  generateRecoveryCodes,
  generateTwoFactorSecret,
  verifyTotp,
} from "@/lib/two-factor";
import { encrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/**
 * Réglages du compte : mot de passe, double authentification et exercice
 * des droits RGPD.
 *
 * Chaque opération sensible exige une reconfirmation du mot de passe : un
 * accès à une session ouverte ne suffit pas à désactiver la 2FA ou à
 * supprimer un compte.
 */

export type AccountResult = {
  ok: boolean;
  error?: string;
  qrCodeDataUrl?: string;
  secret?: string;
  recoveryCodes?: string[];
};

/** Étape 1 : génère un secret TOTP et son QR code, sans encore l'activer. */
export async function startTwoFactorSetup(): Promise<AccountResult> {
  const user = await requireUser();

  try {
    const { secret, encryptedSecret } = generateTwoFactorSecret();

    // Le secret est stocké chiffré dès maintenant, mais twoFactorEnabled
    // reste faux : tant que l'utilisateur n'a pas prouvé qu'il sait générer
    // un code valide, la connexion n'est pas impactée.
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encryptedSecret, twoFactorEnabled: false },
    });

    const otpauth = buildOtpAuthUrl(user.email ?? "compte", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
      margin: 1,
      width: 240,
    });

    return { ok: true, qrCodeDataUrl, secret };
  } catch (error) {
    console.error("[2fa] initialisation impossible", error);
    return {
      ok: false,
      error:
        "La double authentification ne peut pas être configurée : clé de chiffrement absente.",
    };
  }
}

/** Étape 2 : vérifie un premier code, active la 2FA et remet les codes de secours. */
export async function confirmTwoFactorSetup(
  token: string,
): Promise<AccountResult> {
  const user = await requireUser();

  const limit = await rateLimit(`2fa:setup:${user.id}`, 10, 900);
  if (!limit.success) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans un instant." };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true },
  });

  if (!record?.twoFactorSecret) {
    return { ok: false, error: "Recommencez la configuration." };
  }
  if (!verifyTotp(record.twoFactorSecret, token)) {
    return { ok: false, error: "Ce code n'est pas valide." };
  }

  const { codes, hashes } = generateRecoveryCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorRecoveryCodes: hashes },
  });

  await logAudit({
    action: "user.2fa_enabled",
    actorId: user.id,
    actorEmail: user.email,
    entity: "User",
    entityId: user.id,
    severity: "WARNING",
  });

  revalidatePath("/compte/securite");
  return { ok: true, recoveryCodes: codes };
}

const disableSchema = z.object({
  password: z.string().min(1).max(200),
});

export async function disableTwoFactor(input: unknown): Promise<AccountResult> {
  const user = await requireUser();
  const parsed = disableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Mot de passe requis." };

  const limit = await rateLimit(`2fa:disable:${user.id}`, 5, 900);
  if (!limit.success) {
    return { ok: false, error: "Trop de tentatives. Réessayez plus tard." };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (
    !record?.passwordHash ||
    !(await verifyPassword(parsed.data.password, record.passwordHash))
  ) {
    return { ok: false, error: "Mot de passe incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
    },
  });

  await logAudit({
    action: "user.2fa_disabled",
    actorId: user.id,
    actorEmail: user.email,
    entity: "User",
    entityId: user.id,
    severity: "CRITICAL",
  });

  revalidatePath("/compte/securite");
  return { ok: true };
}

const passwordSchema = z
  .object({
    current: z.string().min(1).max(200),
    next: z.string().min(1).max(200),
    confirm: z.string().max(200),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirm"],
  });

export async function changePassword(input: unknown): Promise<AccountResult> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const limit = await rateLimit(`password:${user.id}`, 5, 900);
  if (!limit.success) {
    return { ok: false, error: "Trop de tentatives. Réessayez plus tard." };
  }

  const strength = assessPassword(parsed.data.next);
  if (!strength.ok) return { ok: false, error: strength.problems.join(" ") };

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (
    !record?.passwordHash ||
    !(await verifyPassword(parsed.data.current, record.passwordHash))
  ) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });

  await logAudit({
    action: "user.password_changed",
    actorId: user.id,
    actorEmail: user.email,
    entity: "User",
    entityId: user.id,
    severity: "WARNING",
  });

  return { ok: true };
}

/**
 * Droit d'accès et de portabilité : export de toutes les données du compte
 * dans un format structuré et lisible par machine (JSON).
 */
export async function exportMyData(): Promise<{
  ok: boolean;
  data?: string;
  error?: string;
}> {
  const user = await requireUser();

  const limit = await rateLimit(`export:${user.id}`, 3, 86_400);
  if (!limit.success) {
    return {
      ok: false,
      error: "Export déjà demandé aujourd'hui. Réessayez demain.",
    };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      addresses: true,
      orders: { include: { items: true, invoices: true } },
      quotes: true,
      favorites: { include: { product: { select: { name: true, slug: true } } } },
      reviews: true,
    },
  });

  if (!record) return { ok: false, error: "Compte introuvable." };

  // Les champs sensibles (hash du mot de passe, secret 2FA) sont exclus :
  // ils ne constituent pas des données à restituer et leur divulgation
  // affaiblirait la sécurité du compte.
  const {
    passwordHash: _passwordHash,
    twoFactorSecret: _twoFactorSecret,
    twoFactorRecoveryCodes: _twoFactorRecoveryCodes,
    ...safe
  } = record;

  await logAudit({
    action: "user.data_export",
    actorId: user.id,
    actorEmail: user.email,
    entity: "User",
    entityId: user.id,
  });

  return { ok: true, data: JSON.stringify(safe, null, 2) };
}

/**
 * Droit à l'effacement.
 *
 * Le compte est anonymisé plutôt que supprimé : les commandes et les
 * factures doivent être conservées dix ans au titre des obligations
 * comptables et fiscales. On efface donc les données identifiantes tout en
 * préservant les écritures.
 */
export async function requestAccountDeletion(
  input: unknown,
): Promise<AccountResult> {
  const user = await requireUser();
  const parsed = disableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Mot de passe requis." };

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, email: true },
  });

  if (
    !record?.passwordHash ||
    !(await verifyPassword(parsed.data.password, record.passwordHash))
  ) {
    return { ok: false, error: "Mot de passe incorrect." };
  }

  const anonymousEmail = `supprime-${user.id}@anonyme.invalid`;

  await prisma.$transaction([
    prisma.address.deleteMany({ where: { userId: user.id } }),
    prisma.favorite.deleteMany({ where: { userId: user.id } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.newsletterSubscriber.deleteMany({
      where: { email: record.email },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: anonymousEmail,
        name: "Compte supprimé",
        phone: null,
        image: null,
        passwordHash: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
        acceptsMarketing: false,
        anonymizedAt: new Date(),
      },
    }),
    prisma.dataRequest.create({
      data: {
        type: "ERASURE",
        status: "COMPLETED",
        email: record.email,
        userId: user.id,
        message: "Suppression demandée depuis l'espace client.",
        dueAt: new Date(),
        resolvedAt: new Date(),
        resolution:
          "Compte anonymisé. Les factures sont conservées au titre de l'obligation légale de dix ans.",
      },
    }),
  ]);

  await logAudit({
    action: "user.account_anonymized",
    actorId: user.id,
    entity: "User",
    entityId: user.id,
    severity: "CRITICAL",
  });

  return { ok: true };
}

export async function toggleFavorite(productId: string): Promise<AccountResult> {
  const user = await requireUser();
  if (typeof productId !== "string" || productId.length > 60) {
    return { ok: false, error: "Requête invalide." };
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_productId: { userId: user.id, productId } },
    });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/compte/favoris");
  return { ok: true };
}
