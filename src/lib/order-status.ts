import type { OrderStatus } from "@prisma/client";

/**
 * Libellés et étapes de production, partagés par l'administration, l'espace
 * client et les composants navigateur. Ce module reste exempt de dépendance
 * serveur pour pouvoir être importé de part et d'autre.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  IN_PRODUCTION: "En préparation",
  PAINTING: "En peinture",
  PACKING: "Emballage",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

/** Colonnes du planning de production affiché sur le tableau de bord. */
export const PRODUCTION_COLUMNS: OrderStatus[] = [
  "PAID",
  "IN_PRODUCTION",
  "PAINTING",
  "PACKING",
  "SHIPPED",
  "DELIVERED",
];
