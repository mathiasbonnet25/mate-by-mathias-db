import "server-only";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Agrégats du tableau de bord.
 *
 * Seules les commandes effectivement payées entrent dans le chiffre
 * d'affaires ; les commandes annulées et remboursées en sont exclues.
 */
const REVENUE_STATUSES: OrderStatus[] = [
  "PAID",
  "IN_PRODUCTION",
  "PAINTING",
  "PACKING",
  "SHIPPED",
  "DELIVERED",
];

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);
  const previousSince = new Date(Date.now() - days * 2 * 86_400_000);

  const [
    revenue,
    previousRevenue,
    orderCount,
    pendingQuotes,
    openClaims,
    visitors,
    topProducts,
    dailyOrders,
    production,
    lowStock,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        status: { in: REVENUE_STATUSES },
        createdAt: { gte: previousSince, lt: since },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.quote.count({ where: { status: { in: ["NEW", "IN_REVIEW"] } } }),
    prisma.claim.count({
      where: { status: { in: ["RECEIVED", "IN_REVIEW", "AWAITING"] } },
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { visitorHash: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      where: {
        order: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since } },
      },
      _sum: { quantity: true, totalCents: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
    prisma.order.findMany({
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since } },
      select: { createdAt: true, totalCents: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: {
        status: {
          in: ["PAID", "IN_PRODUCTION", "PAINTING", "PACKING", "SHIPPED"],
        },
      },
      _count: true,
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, allowBackorder: false, stock: { lte: 3 } },
      orderBy: { stock: "asc" },
      take: 8,
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  const revenueCents = revenue._sum.totalCents ?? 0;
  const previousRevenueCents = previousRevenue._sum.totalCents ?? 0;
  const paidOrders = revenue._count;

  // Série journalière, y compris les jours sans vente : une courbe avec des
  // trous se lit mal.
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(day, 0);
  }
  for (const order of dailyOrders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    buckets.set(day, (buckets.get(day) ?? 0) + order.totalCents);
  }

  return {
    revenueCents,
    revenueTrend:
      previousRevenueCents === 0
        ? null
        : Math.round(
            ((revenueCents - previousRevenueCents) / previousRevenueCents) * 100,
          ),
    orderCount,
    paidOrders,
    pendingQuotes,
    openClaims,
    uniqueVisitors: new Set(visitors.map((v) => v.visitorHash)).size,
    pageViews: visitors.length,
    averageBasketCents: paidOrders > 0 ? Math.round(revenueCents / paidOrders) : 0,
    conversionRate:
      visitors.length > 0
        ? Math.round((paidOrders / new Set(visitors.map((v) => v.visitorHash)).size) * 1000) / 10
        : 0,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      name: p.name,
      quantity: p._sum.quantity ?? 0,
      revenueCents: p._sum.totalCents ?? 0,
    })),
    salesSeries: Array.from(buckets.entries()).map(([date, cents]) => ({
      date,
      cents,
    })),
    production: production.map((p) => ({ status: p.status, count: p._count })),
    lowStock: lowStock.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.label,
      stock: v.stock,
      productName: v.product.name,
      productSlug: v.product.slug,
    })),
  };
}

/** Enregistre une vue de page, si le visiteur a consenti à la mesure d'audience. */
export async function recordPageView(params: {
  path: string;
  referrer: string | null;
  visitorHash: string;
  device: string;
}): Promise<void> {
  try {
    await prisma.pageView.create({ data: params });
  } catch {
    // La mesure d'audience ne doit jamais perturber la navigation.
  }
}

/** Purge des vues au-delà de 13 mois, durée maximale recommandée par la CNIL. */
export async function purgeOldPageViews(): Promise<number> {
  const limit = new Date(Date.now() - 396 * 86_400_000);
  const { count } = await prisma.pageView.deleteMany({
    where: { createdAt: { lt: limit } },
  });
  return count;
}
