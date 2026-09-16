"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { nextSequenceNumber } from "@/lib/numbering";
import { notifyWorkshop } from "@/lib/email";

export type QuoteAdminResult = { ok: boolean; error?: string; orderNumber?: string };

const updateSchema = z.object({
  quoteId: z.string().min(1).max(60),
  status: z.enum([
    "NEW",
    "IN_REVIEW",
    "SENT",
    "ACCEPTED",
    "DECLINED",
    "EXPIRED",
    "CONVERTED",
  ]),
  /** Montant du devis, saisi en euros dans l'interface. */
  quotedEuros: z.number().min(0).max(1_000_000).nullable(),
  internalNote: z.string().trim().max(3000).optional(),
  validUntil: z.string().max(30).optional(),
});

export async function updateQuote(input: unknown): Promise<QuoteAdminResult> {
  const staff = await requireStaff();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const { quoteId, status, quotedEuros, internalNote, validUntil } = parsed.data;

  try {
    const before = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true, quotedCents: true },
    });
    if (!before) return { ok: false, error: "Devis introuvable." };

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status,
        quotedCents:
          quotedEuros == null ? null : Math.round(quotedEuros * 100),
        internalNote: internalNote || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        ...(status === "SENT" ? { sentAt: new Date() } : {}),
        ...(status === "ACCEPTED" || status === "DECLINED"
          ? { respondedAt: new Date() }
          : {}),
      },
    });

    await logAudit({
      action: "quote.update",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Quote",
      entityId: quoteId,
      diff: {
        status: { from: before.status, to: status },
        quotedCents: {
          from: before.quotedCents,
          to: quotedEuros == null ? null : Math.round(quotedEuros * 100),
        },
      },
    });

    revalidatePath("/admin/devis");
    revalidatePath(`/admin/devis/${quoteId}`);
    return { ok: true };
  } catch (error) {
    console.error("[admin] mise à jour du devis impossible", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

/**
 * Transforme un devis accepté en commande.
 *
 * La commande créée porte une seule ligne décrivant la prestation, avec la
 * configuration complète conservée en clair : une évolution du barème ne
 * doit pas altérer une commande déjà passée.
 */
export async function convertQuoteToOrder(
  quoteId: string,
): Promise<QuoteAdminResult> {
  const staff = await requireStaff();
  if (typeof quoteId !== "string") {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return { ok: false, error: "Devis introuvable." };
    if (quote.orderId) {
      return { ok: false, error: "Ce devis a déjà été transformé en commande." };
    }
    if (quote.quotedCents == null || quote.quotedCents <= 0) {
      return {
        ok: false,
        error: "Renseignez d'abord le montant du devis.",
      };
    }

    const config = quote.configuration as {
      support?: { label?: string } | null;
      paint?: { label?: string } | null;
      finish?: { label?: string } | null;
      extras?: { label?: string }[] | null;
    } | null;

    const description = [
      config?.support?.label,
      config?.paint?.label,
      config?.finish?.label,
      ...(config?.extras?.map((e) => e.label) ?? []),
    ]
      .filter(Boolean)
      .join(" · ");

    const number = await nextSequenceNumber("order", "MBM");
    // Prix TTC : la part de TVA est déduite du montant, au taux normal.
    const vatCents = Math.round(
      quote.quotedCents - quote.quotedCents / 1.2,
    );

    const order = await prisma.order.create({
      data: {
        number,
        userId: quote.userId,
        email: quote.email,
        phone: quote.phone,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        subtotalCents: quote.quotedCents,
        vatCents,
        totalCents: quote.quotedCents,
        // Prestation nettement personnalisée : pas de droit de rétractation.
        withdrawalWaived: true,
        items: {
          create: {
            name: "Prestation de personnalisation sur mesure",
            variantLabel: description || null,
            quantity: 1,
            unitPriceCents: quote.quotedCents,
            totalCents: quote.quotedCents,
            // Prisma distingue JSON null et absence de valeur : on retombe
            // sur `undefined` plutôt que de laisser passer un null typé.
            customization: quote.configuration ?? undefined,
          },
        },
        events: {
          create: {
            status: "PENDING_PAYMENT",
            message: `Commande créée à partir du devis ${quote.number}.`,
            createdBy: staff.email ?? null,
          },
        },
      },
    });

    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "CONVERTED", orderId: order.id },
    });

    await logAudit({
      action: "quote.convert",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Quote",
      entityId: quote.id,
      diff: { orderNumber: order.number },
      severity: "WARNING",
    });

    await notifyWorkshop({
      subject: `Devis ${quote.number} transformé en commande ${order.number}`,
      body: `Client : ${quote.firstName} ${quote.lastName} (${quote.email})\nMontant : ${(quote.quotedCents / 100).toFixed(2)} € TTC`,
    });

    revalidatePath("/admin/devis");
    revalidatePath("/admin/commandes");
    return { ok: true, orderNumber: order.number };
  } catch (error) {
    console.error("[admin] conversion du devis impossible", error);
    return { ok: false, error: "La conversion a échoué." };
  }
}
