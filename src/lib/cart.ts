import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomToken } from "@/lib/crypto";
import { computeTotals, type CartLine } from "@/lib/pricing";
import { auth } from "@/lib/auth";

/**
 * Le panier est identifié par un cookie strictement nécessaire : il permet
 * de conserver une commande en cours et n'est donc pas soumis au
 * consentement aux traceurs.
 */
export const CART_COOKIE = "mbm-cart";
const CART_TTL_DAYS = 30;

export async function getCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Crée le panier si nécessaire. À n'appeler que depuis une action serveur. */
export async function getOrCreateCart() {
  const store = await cookies();
  const session = await auth();
  let token = store.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token } });
    if (existing) {
      // Rattache le panier anonyme au compte dès la connexion.
      if (session?.user?.id && existing.userId !== session.user.id) {
        return prisma.cart.update({
          where: { id: existing.id },
          data: { userId: session.user.id, email: session.user.email },
        });
      }
      return existing;
    }
  }

  token = randomToken(24);
  const cart = await prisma.cart.create({
    data: {
      token,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      expiresAt: new Date(Date.now() + CART_TTL_DAYS * 86_400_000),
    },
  });

  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_DAYS * 86_400,
  });

  return cart;
}

export type CartView = Awaited<ReturnType<typeof getCartView>>;

/** Panier complet, prix recalculés à partir du catalogue (jamais du client). */
export async function getCartView() {
  const token = await getCartToken();
  const empty = {
    id: null as string | null,
    items: [] as CartItemView[],
    discountCode: null as string | null,
    totals: {
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      vatCents: 0,
      totalCents: 0,
      totalWeightGrams: 0,
      shippingLabel: null as string | null,
    },
    count: 0,
  };

  if (!token) return empty;

  const cart = await prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true, basePriceCents: true, vatRate: true, weightGrams: true, universe: true } },
              images: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) return empty;

  const items: CartItemView[] = cart.items.map((item) => {
    const unitPriceCents =
      item.variant.priceCents ?? item.variant.product.basePriceCents;
    return {
      id: item.id,
      variantId: item.variantId,
      productSlug: item.variant.product.slug,
      productName: item.variant.product.name,
      variantLabel: item.variant.label,
      sku: item.variant.sku,
      imageUrl: item.variant.images[0]?.url ?? null,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * item.quantity,
      stock: item.variant.stock,
      allowBackorder: item.variant.allowBackorder,
      universe: item.variant.product.universe,
    };
  });

  const lines: CartLine[] = cart.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPriceCents:
      item.variant.priceCents ?? item.variant.product.basePriceCents,
    vatRate: item.variant.product.vatRate,
    weightGrams:
      item.variant.weightGrams ?? item.variant.product.weightGrams ?? 500,
  }));

  const totals = await computeTotals(lines, {
    discountCode: cart.discountCode,
    zone: "FR",
  });

  return {
    id: cart.id,
    items,
    discountCode: cart.discountCode,
    totals: {
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      shippingCents: totals.shippingCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      totalWeightGrams: totals.totalWeightGrams,
      shippingLabel: totals.shippingLabel,
    },
    count: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export type CartItemView = {
  id: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  stock: number;
  allowBackorder: boolean;
  universe: string;
};

const MAX_QUANTITY_PER_LINE = 20;

export async function addToCart(variantId: string, quantity = 1) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { status: true, basePriceCents: true } } },
  });

  if (!variant || !variant.isActive || variant.product.status !== "PUBLISHED") {
    throw new Error("Cet article n'est plus disponible.");
  }
  if (!variant.allowBackorder && variant.stock <= 0) {
    throw new Error("Cet article est en rupture de stock.");
  }

  const cart = await getOrCreateCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const target = Math.min(
    (existing?.quantity ?? 0) + quantity,
    MAX_QUANTITY_PER_LINE,
    variant.allowBackorder ? MAX_QUANTITY_PER_LINE : variant.stock,
  );

  if (target <= 0) throw new Error("Quantité indisponible.");

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: {
      cartId: cart.id,
      variantId,
      quantity: target,
      unitPriceCents: variant.priceCents ?? variant.product.basePriceCents,
    },
    update: {
      quantity: target,
      unitPriceCents: variant.priceCents ?? variant.product.basePriceCents,
    },
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { expiresAt: new Date(Date.now() + CART_TTL_DAYS * 86_400_000) },
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  const token = await getCartToken();
  if (!token) throw new Error("Panier introuvable.");

  // On vérifie que la ligne appartient bien au panier du cookie courant :
  // un identifiant deviné ne doit pas permettre de modifier un autre panier.
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { token } },
    include: { variant: true },
  });
  if (!item) throw new Error("Article introuvable.");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return;
  }

  const max = item.variant.allowBackorder
    ? MAX_QUANTITY_PER_LINE
    : Math.min(item.variant.stock, MAX_QUANTITY_PER_LINE);

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: Math.max(1, Math.min(quantity, max)) },
  });
}

export async function removeCartItem(itemId: string) {
  const token = await getCartToken();
  if (!token) return;
  await prisma.cartItem.deleteMany({
    where: { id: itemId, cart: { token } },
  });
}

export async function applyDiscountCode(code: string | null) {
  const token = await getCartToken();
  if (!token) throw new Error("Panier introuvable.");
  await prisma.cart.update({
    where: { token },
    data: { discountCode: code ? code.toUpperCase().trim() : null },
  });
}
