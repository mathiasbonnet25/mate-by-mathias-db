import { NextResponse } from "next/server";

import { getCartView } from "@/lib/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nombre d'articles dans le panier.
 *
 * Ce compteur est le seul élément personnel de l'en-tête. Le servir par une
 * requête dédiée permet de garder l'ensemble des pages publiques en cache,
 * au lieu de les rendre à chaque visite pour un simple chiffre.
 */
export async function GET() {
  try {
    const cart = await getCartView();
    return NextResponse.json(
      { count: cart.count },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
