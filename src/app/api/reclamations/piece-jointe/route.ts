import { NextResponse } from "next/server";

import { storeMedia } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { hashIp } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Téléversement d'une photo jointe à une réclamation.
 *
 * C'est le seul point d'entrée du site ouvert au public qui accepte un
 * fichier. Les garde-fous sont donc resserrés :
 *
 *  - **Images seules.** Un PDF peut embarquer du JavaScript ; servi depuis
 *    le même domaine que le site, il deviendrait un vecteur d'attaque. Le
 *    formulaire invite à transmettre tout autre document en réponse à
 *    l'accusé de réception, par courriel.
 *  - **Ré-encodage systématique.** `storeMedia` reconstruit l'image avec
 *    sharp : un fichier forgé pour contenir du code ne survit pas à
 *    l'opération, et les métadonnées EXIF — dont la position GPS —
 *    disparaissent au passage.
 *  - **Débit limité** par empreinte d'adresse réseau, pour éviter qu'on ne
 *    remplisse le stockage.
 *  - **Dossier dédié**, séparé des médias de la boutique.
 */
const TYPES_ACCEPTES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const TAILLE_MAX = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const ip = await getClientIp();
  const limite = await rateLimit(
    `reclamation:piece:${hashIp(ip) ?? "inconnue"}`,
    15,
    3600,
  );
  if (!limite.success) {
    return NextResponse.json(
      { error: "Trop d'envois. Merci de réessayer dans une heure." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const fichier = formData.get("file");

    if (!(fichier instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }
    if (!TYPES_ACCEPTES.has(fichier.type)) {
      return NextResponse.json(
        {
          error:
            "Format non accepté. Envoyez une photo au format JPEG, PNG, WebP ou AVIF.",
        },
        { status: 400 },
      );
    }
    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json(
        { error: "Photo trop lourde (8 Mo maximum)." },
        { status: 400 },
      );
    }

    const stocke = await storeMedia(fichier, "/reclamations");

    return NextResponse.json({
      url: stocke.url,
      fileName: stocke.fileName,
      mimeType: stocke.mimeType,
    });
  } catch (error) {
    console.error("[réclamation] pièce jointe refusée", error);
    return NextResponse.json(
      { error: "Envoi impossible. Vérifiez le fichier et réessayez." },
      { status: 400 },
    );
  }
}
