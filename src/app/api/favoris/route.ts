import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * État d'un favori pour le visiteur courant.
 *
 * Interrogé par le bouton depuis le navigateur, et non calculé dans le
 * rendu de la fiche produit : celle-ci reste ainsi pré-rendue et servie
 * depuis le cache pour tout le monde. C'est le même principe que le
 * compteur du panier.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("produit");

  if (!productId || productId.length > 60) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { signedIn: false, favorite: false },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const existe = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId: session.user.id, productId },
      },
      select: { productId: true },
    });

    return NextResponse.json(
      { signedIn: true, favorite: Boolean(existe) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ signedIn: false, favorite: false });
  }
}
