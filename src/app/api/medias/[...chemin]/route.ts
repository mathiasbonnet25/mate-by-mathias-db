import { NextResponse } from "next/server";

import { cleValide, depotMedias } from "@/lib/media-store";

/**
 * Sert les photos conservées dans le dépôt de l'hébergeur.
 *
 * Ce dépôt n'expose pas d'adresse publique : sans cette route, les fichiers
 * seraient bien stockés mais invisibles. Les servir depuis le domaine du
 * site présente un avantage — aucune origine distante à déclarer, et les
 * adresses restent valables si l'on change de fournisseur de stockage.
 *
 * Les images sont figées : leur nom contient l'empreinte du contenu, une
 * modification produit donc un nouveau nom. On peut les mettre en cache
 * sans limite, ce qui évite de réveiller une fonction serveur à chaque
 * affichage.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ chemin: string[] }> },
) {
  const { chemin } = await params;
  const cle = chemin.join("/");

  if (!cleValide(cle)) {
    return NextResponse.json({ error: "Adresse invalide." }, { status: 400 });
  }

  const depot = depotMedias();
  if (!depot) {
    return NextResponse.json(
      { error: "Aucun dépôt de médias n'est disponible." },
      { status: 503 },
    );
  }

  const fichier = await depot.getWithMetadata(cle, { type: "arrayBuffer" });
  if (!fichier) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const type =
    typeof fichier.metadata.contentType === "string"
      ? fichier.metadata.contentType
      : "application/octet-stream";

  return new NextResponse(fichier.data, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      // Le nom du fichier vient de nous, jamais du visiteur ; l'en-tête
      // interdit malgré tout au navigateur de deviner un autre type.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
