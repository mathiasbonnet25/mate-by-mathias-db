"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { nextSequenceNumber } from "@/lib/numbering";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export type AdminResult = { ok: boolean; error?: string; id?: string };

const statusSchema = z.object({
  orderId: z.string().min(1).max(60),
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "IN_PRODUCTION",
    "PAINTING",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  message: z.string().trim().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
});

/**
 * Change le statut d'une commande et consigne l'événement.
 *
 * L'historique est conservé intégralement : il sert à répondre à une
 * contestation et constitue une piste d'audit.
 */
export async function updateOrderStatus(input: unknown): Promise<AdminResult> {
  const staff = await requireStaff();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const { orderId, status, message, notifyCustomer } = parsed.data;

  try {
    const before = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, number: true },
    });
    if (!before) return { ok: false, error: "Commande introuvable." };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus,
        ...(status === "SHIPPED" ? { shippedAt: new Date() } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        events: {
          create: {
            status: status as OrderStatus,
            message: message || ORDER_STATUS_LABELS[status as OrderStatus],
            isPublic: notifyCustomer,
            createdBy: staff.email ?? null,
          },
        },
      },
    });

    await logAudit({
      action: "order.status_change",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Order",
      entityId: orderId,
      diff: { from: before.status, to: status },
    });

    revalidatePath("/admin/commandes");
    revalidatePath(`/admin/commandes/${before.number}`);
    return { ok: true };
  } catch (error) {
    console.error("[admin] changement de statut impossible", error);
    return { ok: false, error: "Le statut n'a pas pu être modifié." };
  }
}

const shippingSchema = z.object({
  orderId: z.string().min(1).max(60),
  carrier: z.string().trim().max(80),
  trackingNumber: z.string().trim().max(120),
  trackingUrl: z.string().trim().url().max(500).or(z.literal("")),
});

export async function updateOrderShipping(input: unknown): Promise<AdminResult> {
  const staff = await requireStaff();
  const parsed = shippingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Vérifiez le lien de suivi." };
  }

  try {
    const order = await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        carrier: parsed.data.carrier || null,
        trackingNumber: parsed.data.trackingNumber || null,
        trackingUrl: parsed.data.trackingUrl || null,
      },
      select: { number: true },
    });

    await logAudit({
      action: "order.shipping_update",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Order",
      entityId: parsed.data.orderId,
    });

    revalidatePath(`/admin/commandes/${order.number}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
}

const noteSchema = z.object({
  orderId: z.string().min(1).max(60),
  internalNote: z.string().trim().max(3000),
});

export async function updateOrderNote(input: unknown): Promise<AdminResult> {
  const staff = await requireStaff();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  try {
    const order = await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: { internalNote: parsed.data.internalNote || null },
      select: { number: true },
    });
    await logAudit({
      action: "order.note_update",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Order",
      entityId: parsed.data.orderId,
    });
    revalidatePath(`/admin/commandes/${order.number}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
}

/**
 * Émet la facture d'une commande payée.
 *
 * La numérotation est séquentielle et continue, sans trou : elle est
 * produite dans une transaction par `nextSequenceNumber`. Une facture déjà
 * émise n'est jamais dupliquée ni renumérotée.
 */
export async function issueInvoice(orderId: string): Promise<AdminResult> {
  const staff = await requireStaff();
  if (typeof orderId !== "string") {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoices: true },
    });
    if (!order) return { ok: false, error: "Commande introuvable." };
    if (order.paymentStatus !== "PAID") {
      return {
        ok: false,
        error: "La facture ne peut être émise qu'après encaissement.",
      };
    }
    if (order.invoices.length > 0) {
      return { ok: false, error: "Une facture existe déjà pour cette commande." };
    }

    const number = await nextSequenceNumber("invoice", "FA");
    const invoice = await prisma.invoice.create({
      data: {
        number,
        orderId: order.id,
        totalCents: order.totalCents,
        vatCents: order.vatCents,
      },
    });

    await logAudit({
      action: "invoice.issue",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "Invoice",
      entityId: invoice.id,
      diff: { number },
      severity: "WARNING",
    });

    revalidatePath(`/admin/commandes/${order.number}`);
    return { ok: true, id: invoice.id };
  } catch (error) {
    console.error("[admin] émission de facture impossible", error);
    return { ok: false, error: "La facture n'a pas pu être émise." };
  }
}
