"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addToCart,
  applyDiscountCode,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";

/**
 * Actions serveur du panier.
 *
 * Next.js protège nativement les actions serveur contre le CSRF (vérification
 * de l'origine + identifiant d'action non devinable). Les quantités et les
 * prix sont systématiquement recalculés côté serveur : rien de ce que le
 * navigateur envoie n'est considéré comme fiable.
 */

export type ActionResult = { ok: boolean; error?: string };

const addSchema = z.object({
  variantId: z.string().min(1).max(60),
  quantity: z.number().int().min(1).max(20).default(1),
});

async function throttle(scope: string, limit = 60): Promise<boolean> {
  const ip = await getClientIp();
  const key = `${scope}:${hashIp(ip) ?? "unknown"}`;
  const result = await rateLimit(key, limit, 60);
  return result.success;
}

export async function addToCartAction(
  variantId: string,
  quantity = 1,
): Promise<ActionResult> {
  const parsed = addSchema.safeParse({ variantId, quantity });
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  if (!(await throttle("cart:add"))) {
    return { ok: false, error: "Trop de requêtes. Merci de patienter." };
  }

  try {
    await addToCart(parsed.data.variantId, parsed.data.quantity);
    revalidatePath("/panier");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ajout impossible.",
    };
  }
}

export async function updateCartItemAction(
  itemId: string,
  quantity: number,
): Promise<ActionResult> {
  if (typeof itemId !== "string" || !Number.isInteger(quantity)) {
    return { ok: false, error: "Requête invalide." };
  }
  if (!(await throttle("cart:update"))) {
    return { ok: false, error: "Trop de requêtes. Merci de patienter." };
  }
  try {
    await updateCartItem(itemId, quantity);
    revalidatePath("/panier");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Modification impossible.",
    };
  }
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult> {
  if (typeof itemId !== "string") return { ok: false, error: "Requête invalide." };
  try {
    await removeCartItem(itemId);
    revalidatePath("/panier");
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

export async function applyDiscountAction(code: string): Promise<ActionResult> {
  const clean = code.trim().slice(0, 40);
  if (!(await throttle("cart:discount", 20))) {
    return { ok: false, error: "Trop de tentatives. Merci de patienter." };
  }
  try {
    await applyDiscountCode(clean || null);
    revalidatePath("/panier");
    return { ok: true };
  } catch {
    return { ok: false, error: "Code promo non appliqué." };
  }
}
