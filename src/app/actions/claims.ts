"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth, requireStaff } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { nextSequenceNumber } from "@/lib/numbering";
import { sendClaimAcknowledgement, notifyWorkshop } from "@/lib/email";

/**
 * Réclamations.
 *
 * Le dépôt est ouvert au public : il est donc borné, limité en débit et
 * validé pièce par pièce. Le numéro de commande saisi est conservé tel
 * quel même s'il ne correspond à rien en base — une faute de frappe ne
 * doit pas faire perdre la demande.
 */

const RAISONS = [
  "DAMAGED",
  "NOT_CONFORM",
  "MISSING",
  "DELAY",
  "QUALITY",
  "WITHDRAWAL",
  "OTHER",
] as const;

const pieceJointe = z.object({
  url: z.string().trim().max(600),
  fileName: z.string().trim().max(200),
  mimeType: z.string().trim().max(100),
});

const depotSchema = z.object({
  firstName: z.string().trim().min(1, "Merci d'indiquer votre prénom.").max(80),
  lastName: z.string().trim().min(1, "Merci d'indiquer votre nom.").max(80),
  email: z.string().trim().email("Adresse électronique invalide.").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  orderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  reason: z.enum(RAISONS),
  description: z
    .string()
    .trim()
    .min(20, "Merci de décrire le problème en quelques phrases.")
    .max(5000),
  attachments: z.array(pieceJointe).max(5),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est nécessaire." }),
  }),
  /** Champ leurre, invisible pour les personnes. */
  website: z.string().max(0).optional(),
});

export type ClaimResult = { ok: boolean; number?: string; error?: string };

export async function submitClaimAction(input: unknown): Promise<ClaimResult> {
  const parsed = depotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const ip = await getClientIp();
  const limite = await rateLimit(`reclamation:${hashIp(ip) ?? "inconnue"}`, 5, 3600);
  if (!limite.success) {
    return {
      ok: false,
      error: "Trop de demandes envoyées. Merci de réessayer dans une heure.",
    };
  }

  const data = parsed.data;

  try {
    const session = await auth();

    // Le rattachement à une commande n'est fait que si le numéro
    // correspond réellement. Sinon on conserve la saisie brute.
    const commande = data.orderNumber
      ? await prisma.order.findUnique({
          where: { number: data.orderNumber.trim().toUpperCase() },
          select: { id: true },
        })
      : null;

    const number = await nextSequenceNumber("claim", "REC");

    const claim = await prisma.claim.create({
      data: {
        number,
        reason: data.reason,
        userId: session?.user?.id ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        orderId: commande?.id ?? null,
        orderNumber: data.orderNumber || null,
        description: data.description,
        attachments: data.attachments.length ? data.attachments : undefined,
        acknowledgedAt: new Date(),
        messages: {
          create: {
            author: "CLIENT",
            authorName: `${data.firstName} ${data.lastName}`.trim(),
            body: data.description,
            attachments: data.attachments.length ? data.attachments : undefined,
          },
        },
      },
    });

    // L'échec d'un courriel ne doit pas perdre la réclamation : elle est
    // déjà enregistrée et visible dans l'administration.
    await Promise.allSettled([
      sendClaimAcknowledgement({
        to: claim.email,
        firstName: claim.firstName,
        number: claim.number,
      }),
      notifyWorkshop({
        subject: `Nouvelle réclamation ${claim.number}`,
        body:
          `${claim.firstName} ${claim.lastName} (${claim.email})\n` +
          `Commande : ${claim.orderNumber ?? "non renseignée"}\n` +
          `Motif : ${claim.reason}\n\n${claim.description}`,
      }),
    ]);

    return { ok: true, number: claim.number };
  } catch (error) {
    console.error("[réclamation] enregistrement impossible", error);
    return {
      ok: false,
      error: "L'envoi a échoué. Merci de réessayer dans un instant.",
    };
  }
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

const suiviSchema = z.object({
  claimId: z.string().min(1).max(60),
  status: z.enum(["RECEIVED", "IN_REVIEW", "AWAITING", "RESOLVED", "REJECTED"]),
  internalNote: z.string().trim().max(5000).optional(),
  resolution: z.string().trim().max(5000).optional(),
});

export async function updateClaimAction(input: unknown): Promise<ClaimResult> {
  const staff = await requireStaff();
  const parsed = suiviSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const { claimId, status, internalNote, resolution } = parsed.data;

  try {
    const avant = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { status: true, number: true },
    });
    if (!avant) return { ok: false, error: "Dossier introuvable." };

    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status,
        internalNote: internalNote || null,
        resolution: resolution || null,
        resolvedAt:
          status === "RESOLVED" || status === "REJECTED" ? new Date() : null,
      },
    });

    await logAudit({
      action: "claim.update",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Claim",
      entityId: claimId,
      diff: { from: avant.status, to: status },
      severity: "WARNING",
    });

    revalidatePath("/admin/reclamations");
    revalidatePath(`/admin/reclamations/${claimId}`);
    return { ok: true, number: avant.number };
  } catch (error) {
    console.error("[réclamation] mise à jour impossible", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

const messageSchema = z.object({
  claimId: z.string().min(1).max(60),
  body: z.string().trim().min(1, "Le message est vide.").max(5000),
  /** Une note interne n'est jamais affichée au client. */
  isInternal: z.boolean().default(false),
});

export async function addClaimMessageAction(
  input: unknown,
): Promise<ClaimResult> {
  const staff = await requireStaff();
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Requête invalide.",
    };
  }

  try {
    const claim = await prisma.claim.findUnique({
      where: { id: parsed.data.claimId },
      select: { id: true, email: true, number: true, firstName: true },
    });
    if (!claim) return { ok: false, error: "Dossier introuvable." };

    await prisma.claimMessage.create({
      data: {
        claimId: claim.id,
        author: "ATELIER",
        authorName: staff.email ?? "Atelier",
        body: parsed.data.body,
        isInternal: parsed.data.isInternal,
      },
    });

    // Seul un message destiné au client déclenche un envoi.
    if (!parsed.data.isInternal) {
      await notifyWorkshop({
        subject: `Réponse envoyée — réclamation ${claim.number}`,
        body: `À ${claim.email}\n\n${parsed.data.body}`,
      });
    }

    await logAudit({
      action: parsed.data.isInternal ? "claim.note" : "claim.reply",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Claim",
      entityId: claim.id,
    });

    revalidatePath(`/admin/reclamations/${claim.id}`);
    return { ok: true };
  } catch (error) {
    console.error("[réclamation] message non enregistré", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}
