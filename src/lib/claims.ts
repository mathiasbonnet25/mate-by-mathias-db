import type { ClaimReason, ClaimStatus } from "@prisma/client";

/**
 * Libellés des réclamations, partagés par l'administration et les
 * composants navigateur. Module sans dépendance serveur, pour être
 * importable des deux côtés.
 */
export const CLAIM_REASON_LABELS: Record<ClaimReason, string> = {
  DAMAGED: "Produit endommagé à la réception",
  NOT_CONFORM: "Produit non conforme",
  MISSING: "Article manquant",
  DELAY: "Retard de livraison",
  QUALITY: "Défaut constaté à l'usage",
  WITHDRAWAL: "Demande de rétractation",
  OTHER: "Autre motif",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  RECEIVED: "Reçue",
  IN_REVIEW: "À l'étude",
  AWAITING: "En attente du client",
  RESOLVED: "Résolue",
  REJECTED: "Rejetée",
};

/** Un dossier est ouvert tant qu'il n'a pas été tranché. */
export const CLAIM_OPEN_STATUSES: ClaimStatus[] = [
  "RECEIVED",
  "IN_REVIEW",
  "AWAITING",
];

/**
 * Engagement de réponse motivée : quinze jours à compter du dépôt.
 * Passé ce délai, le dossier remonte en tête de liste.
 */
export const CLAIM_RESPONSE_DAYS = 15;

export function claimDueDate(createdAt: Date | string): Date {
  return new Date(
    new Date(createdAt).getTime() + CLAIM_RESPONSE_DAYS * 86_400_000,
  );
}
