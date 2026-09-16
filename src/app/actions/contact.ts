"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";
import { notifyWorkshop } from "@/lib/email";

/**
 * Formulaire de contact et demandes relatives aux données personnelles.
 *
 * Les demandes d'exercice des droits RGPD sont enregistrées séparément,
 * avec leur échéance légale d'un mois, afin d'être suivies dans
 * l'administration et de ne pas se perdre dans la boîte de réception.
 */
const schema = z.object({
  name: z.string().trim().min(1, "Merci d'indiquer votre nom.").max(120),
  email: z.string().trim().email("Adresse électronique invalide.").max(160),
  subject: z.string().trim().min(1, "Merci d'indiquer un objet.").max(180),
  message: z
    .string()
    .trim()
    .min(10, "Votre message est trop court.")
    .max(5000),
  /// Nature de la demande, pour l'orientation interne.
  kind: z.enum(["general", "sav", "complaint", "data"]).default("general"),
  /// Droit exercé, lorsque la demande porte sur les données personnelles.
  dataRight: z
    .enum([
      "ACCESS",
      "RECTIFICATION",
      "ERASURE",
      "PORTABILITY",
      "OBJECTION",
      "RESTRICTION",
    ])
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est nécessaire." }),
  }),
  website: z.string().max(0).optional(),
});

export type ContactResult = { ok: boolean; error?: string };

export async function submitContactAction(
  input: unknown,
): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`contact:${hashIp(ip) ?? "unknown"}`, 5, 3600);
  if (!limit.success) {
    return {
      ok: false,
      error: "Trop de messages envoyés. Merci de réessayer dans une heure.",
    };
  }

  const data = parsed.data;

  try {
    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        subject: data.subject,
        message: data.message,
        isComplaint: data.kind === "complaint",
      },
    });

    if (data.kind === "data" && data.dataRight) {
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        select: { id: true },
      });

      await prisma.dataRequest.create({
        data: {
          type: data.dataRight,
          email: data.email.toLowerCase(),
          userId: user?.id ?? null,
          message: data.message,
          // Le RGPD impose une réponse dans le mois suivant la réception.
          dueAt: new Date(Date.now() + 30 * 86_400_000),
        },
      });
    }

    await notifyWorkshop({
      subject: `[${data.kind}] ${data.subject}`,
      body: `${data.name} (${data.email})\n\n${data.message}`,
    });

    return { ok: true };
  } catch (error) {
    console.error("[contact] enregistrement impossible", error);
    return { ok: false, error: "L'envoi a échoué. Merci de réessayer." };
  }
}
