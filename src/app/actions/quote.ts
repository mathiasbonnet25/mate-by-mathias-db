"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";
import { getCustomizationOptions, estimate } from "@/lib/customization";
import { sendQuoteAcknowledgement, notifyWorkshop } from "@/lib/email";
import { nextSequenceNumber } from "@/lib/numbering";

/**
 * Enregistrement d'une demande de devis issue de l'atelier.
 *
 * Points de vigilance :
 *  - le montant estimé est recalculé ici à partir du barème en base ; celui
 *    affiché par le navigateur n'est jamais repris ;
 *  - les chaînes sont bornées en longueur et validées avant insertion ;
 *  - un champ leurre (« website ») arrête les robots les plus simples ;
 *  - le nombre de demandes par adresse réseau est limité.
 */
const schema = z.object({
  selection: z.object({
    support: z.string().max(60).nullable(),
    paint: z.string().max(60).nullable(),
    finish: z.string().max(60).nullable(),
    extras: z.array(z.string().max(60)).max(20),
  }),
  firstName: z.string().trim().min(1, "Prénom requis.").max(80),
  lastName: z.string().trim().min(1, "Nom requis.").max(80),
  email: z.string().trim().email("Adresse électronique invalide.").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est nécessaire." }),
  }),
  website: z.string().max(0).optional(),
});

export type QuoteResult = { ok: boolean; number?: string; error?: string };

export async function submitQuoteAction(
  input: unknown,
): Promise<QuoteResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;

  if (!data.selection.support) {
    return { ok: false, error: "Merci de choisir la pièce à personnaliser." };
  }

  try {
    // Le comptage des envois interroge la base : il appartient au bloc
    // protégé. Placé avant, une base momentanément injoignable — le réveil
    // d'une instance mise en veille, une coupure réseau — faisait échouer
    // l'action entière au lieu d'afficher un message au visiteur.
    const ip = await getClientIp();
    const limit = await rateLimit(
      `quote:${hashIp(ip) ?? "unknown"}`,
      5,
      60 * 60,
    );
    if (!limit.success) {
      return {
        ok: false,
        error: "Trop de demandes envoyées. Merci de réessayer dans une heure.",
      };
    }

    const options = await getCustomizationOptions();
    const estimateCents = estimate(options, data.selection);

    const session = await auth();
    const number = await nextSequenceNumber("quote", "DEV");

    // On stocke les libellés en plus des identifiants : un barème modifié
    // plus tard ne doit pas rendre la demande illisible.
    const configuration = {
      support: describe(options.SUPPORT, data.selection.support),
      paint: describe(options.PAINT, data.selection.paint),
      finish: describe(options.FINISH, data.selection.finish),
      extras: data.selection.extras.map((slug) =>
        describe(options.EXTRA, slug),
      ),
    };

    const quote = await prisma.quote.create({
      data: {
        number,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        message: data.message || null,
        configuration,
        estimateCents,
        userId: session?.user?.id ?? null,
      },
    });

    // L'échec d'un envoi de courriel ne doit pas perdre la demande :
    // elle est déjà enregistrée et visible dans l'administration.
    await Promise.allSettled([
      sendQuoteAcknowledgement({
        to: quote.email,
        firstName: quote.firstName,
        number: quote.number,
        estimateCents,
      }),
      notifyWorkshop({
        subject: `Nouvelle demande de devis ${quote.number}`,
        body: `${quote.firstName} ${quote.lastName} (${quote.email})\nEstimation : ${(estimateCents / 100).toFixed(2)} €\n\n${quote.message ?? ""}`,
      }),
    ]);

    return { ok: true, number: quote.number };
  } catch (error) {
    console.error("[quote] enregistrement impossible", error);
    return {
      ok: false,
      error: "L'envoi a échoué. Merci de réessayer dans un instant.",
    };
  }
}

function describe(
  list: { slug: string; label: string; priceCents: number }[],
  slug: string | null,
) {
  if (!slug) return null;
  const found = list.find((o) => o.slug === slug);
  return found
    ? { slug: found.slug, label: found.label, priceCents: found.priceCents }
    : { slug, label: slug, priceCents: 0 };
}
