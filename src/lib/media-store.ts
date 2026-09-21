import "server-only";
import { getStore } from "@netlify/blobs";

/**
 * Dépôt de fichiers fourni par l'hébergeur.
 *
 * Netlify met à disposition un stockage d'objets rattaché au site, sans
 * compte supplémentaire ni moyen de paiement. Il évite d'avoir à ouvrir un
 * service tiers pour quelques centaines de photos.
 *
 * Contrairement à un stockage compatible S3, rien n'y est accessible
 * directement par une adresse web : les fichiers sont relus par le site
 * lui-même, qui les sert depuis /api/medias. C'est aussi ce qui permet de
 * les servir depuis le domaine du site, sans configuration d'origine
 * distante ni question de partage entre domaines.
 */

/** Interface réduite à ce dont le site se sert réellement. */
export type DepotMedias = {
  set(
    cle: string,
    donnees: ArrayBuffer,
    options: { metadata: { contentType: string } },
  ): Promise<unknown>;
  getWithMetadata(
    cle: string,
    options: { type: "arrayBuffer" },
  ): Promise<{ data: ArrayBuffer; metadata: Record<string, unknown> } | null>;
};

/** Remplaçant injecté par les tests, à la place du dépôt réel. */
let depotDeTest: DepotMedias | null = null;

/** N'est appelé que depuis les tests. */
export function utiliserDepotDeTest(depot: DepotMedias | null): void {
  depotDeTest = depot;
}

/**
 * Le dépôt, ou null si l'on n'est pas chez l'hébergeur — en développement
 * on préfère le disque local, plus simple à inspecter.
 */
export function depotMedias(): DepotMedias | null {
  if (depotDeTest) return depotDeTest;
  if (!process.env.NETLIFY) return null;

  try {
    const store = getStore({ name: "medias", consistency: "strong" });
    // On enveloppe plutôt que de forcer le type : la bibliothèque accepte
    // des entrées plus variées que ce que le site lui donne, et une
    // conversion de force masquerait un changement de signature.
    return {
      set: (cle, donnees, options) => store.set(cle, donnees, options),
      getWithMetadata: async (cle) => {
        const retour = await store.getWithMetadata(cle, {
          type: "arrayBuffer",
        });
        return retour ? { data: retour.data, metadata: retour.metadata } : null;
      },
    };
  } catch {
    // Le dépôt n'est pas disponible dans ce contexte d'exécution. On laisse
    // l'appelant décider : il vaut mieux un message explicite qu'une panne
    // au premier envoi de photo.
    return null;
  }
}

/**
 * Nettoie un chemin reçu d'une requête avant d'aller chercher le fichier.
 *
 * Le dépôt n'est pas un système de fichiers et « .. » n'y remonte nulle
 * part, mais on refuse quand même tout ce qui n'a pas la forme attendue :
 * une clé se compose de segments simples, et rien d'autre n'a été écrit.
 */
export function cleValide(chemin: string): boolean {
  if (!chemin || chemin.length > 300) return false;
  if (chemin.includes("..")) return false;
  return /^[a-zA-Z0-9/_-]+\.[a-z0-9]{2,5}$/.test(chemin);
}
