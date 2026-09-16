"use server";

import { z } from "zod";
import { AuthError } from "next-auth";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hashPassword, assessPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  /** Le compte exige un second facteur : le formulaire doit le demander. */
  needsTwoFactor?: boolean;
};

const signInSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
  totp: z.string().trim().max(10).optional(),
  recoveryCode: z.string().trim().max(20).optional(),
});

/** Messages destinés à l'utilisateur, sans révéler l'existence du compte. */
const MESSAGES: Record<string, string> = {
  RATE_LIMITED:
    "Trop de tentatives de connexion. Merci de réessayer dans quelques minutes.",
  ACCOUNT_LOCKED:
    "Ce compte est temporairement verrouillé après plusieurs échecs. Réessayez dans un quart d'heure.",
  INVALID_2FA: "Le code de vérification est incorrect ou a expiré.",
  "2FA_REQUIRED": "Saisissez le code de votre application d'authentification.",
};

export async function signInAction(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identifiants invalides." };
  }

  const ip = await getClientIp();

  try {
    await signIn("credentials", {
      ...parsed.data,
      ip,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // La cause remonte le message levé par `authorize`.
      const cause =
        (error.cause as { err?: Error } | undefined)?.err?.message ?? "";

      if (cause === "2FA_REQUIRED") {
        return { ok: false, needsTwoFactor: true, error: MESSAGES[cause] };
      }
      if (cause === "INVALID_2FA") {
        return { ok: false, needsTwoFactor: true, error: MESSAGES[cause] };
      }
      if (MESSAGES[cause]) {
        return { ok: false, error: MESSAGES[cause] };
      }
      return {
        ok: false,
        error: "Adresse électronique ou mot de passe incorrect.",
      };
    }
    // `signIn` lève une redirection en cas de succès avec redirect: true.
    throw error;
  }
}

const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "Merci d'indiquer votre prénom.").max(80),
    lastName: z.string().trim().min(1, "Merci d'indiquer votre nom.").max(80),
    email: z.string().trim().email("Adresse électronique invalide.").max(160),
    password: z.string().min(1, "Merci de choisir un mot de passe.").max(200),
    passwordConfirm: z.string().max(200),
    acceptsTerms: z.literal(true, {
      errorMap: () => ({
        message: "Merci d'accepter les conditions générales de vente.",
      }),
    }),
    acceptsMarketing: z.boolean().default(false),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["passwordConfirm"],
  });

export async function signUpAction(input: unknown): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`signup:${hashIp(ip) ?? "unknown"}`, 5, 3600);
  if (!limit.success) {
    return {
      ok: false,
      error: "Trop de créations de compte. Merci de réessayer plus tard.",
    };
  }

  const data = parsed.data;
  const strength = assessPassword(data.password);
  if (!strength.ok) {
    return { ok: false, error: strength.problems.join(" ") };
  }

  const email = data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    // On ne révèle jamais qu'une adresse est déjà enregistrée : le message
    // renvoyé est le même dans les deux cas, et l'utilisateur légitime
    // recevra une notification par courriel.
    if (existing) {
      return { ok: true };
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: `${data.firstName} ${data.lastName}`.trim(),
        passwordHash: await hashPassword(data.password),
        role: "CLIENT",
        acceptsMarketing: data.acceptsMarketing,
        marketingOptInAt: data.acceptsMarketing ? new Date() : null,
      },
    });

    await logAudit({
      action: "user.signup",
      actorId: user.id,
      actorEmail: user.email,
      entity: "User",
      entityId: user.id,
    });

    await signIn("credentials", {
      email,
      password: data.password,
      ip,
      redirect: false,
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // Le compte est créé mais la connexion automatique a échoué :
      // l'utilisateur pourra se connecter normalement.
      return { ok: true };
    }
    console.error("[auth] création de compte impossible", error);
    return { ok: false, error: "La création du compte a échoué." };
  }
}
