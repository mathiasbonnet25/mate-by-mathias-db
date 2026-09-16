import Link from "next/link";
import { AlertTriangle, TrendingDown } from "lucide-react";

import { AdminHeader, Card, Stat, EmptyState } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/sales-chart";
import { getDashboardData } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS, PRODUCTION_COLUMNS } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  const data = await getDashboardData(30);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      number: true,
      email: true,
      status: true,
      totalCents: true,
      createdAt: true,
    },
  });

  const productionByStatus = new Map(
    data.production.map((p) => [p.status, p.count]),
  );

  return (
    <>
      <AdminHeader
        title="Tableau de bord"
        description="Activité des trente derniers jours."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Chiffre d'affaires"
          value={formatPrice(data.revenueCents)}
          hint={
            data.revenueTrend == null
              ? "Pas de période de comparaison"
              : `${data.revenueTrend > 0 ? "+" : ""}${data.revenueTrend} % sur 30 jours`
          }
        />
        <Stat
          label="Commandes"
          value={String(data.orderCount)}
          hint={`${data.paidOrders} payée${data.paidOrders > 1 ? "s" : ""}`}
          href="/admin/commandes"
        />
        <Stat
          label="Devis à traiter"
          value={String(data.pendingQuotes)}
          hint="Demandes reçues ou à l'étude"
          href="/admin/devis"
        />
        <Stat
          label="Visiteurs uniques"
          value={String(data.uniqueVisitors)}
          hint={`${data.pageViews} pages vues`}
          href="/admin/statistiques"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Panier moyen" value={formatPrice(data.averageBasketCents)} />
        <Stat
          label="Taux de conversion"
          value={`${data.conversionRate} %`}
          hint="Commandes payées / visiteurs uniques"
        />
        <Stat
          label="Ventes payées"
          value={String(data.paidOrders)}
          hint="Hors annulations et remboursements"
        />
        <Stat
          label="Stock faible"
          value={String(data.lowStock.length)}
          hint="Variantes à 3 unités ou moins"
          href="/admin/produits"
        />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Chiffre d'affaires quotidien">
          {data.salesSeries.every((p) => p.cents === 0) ? (
            <EmptyState message="Aucune vente enregistrée sur la période." />
          ) : (
            <SalesChart data={data.salesSeries} />
          )}
        </Card>

        <Card title="Produits les plus vendus">
          {data.topProducts.length === 0 ? (
            <EmptyState message="Aucune vente sur la période." />
          ) : (
            <ol className="space-y-3.5">
              {data.topProducts.map((product, index) => (
                <li
                  key={`${product.productId}-${index}`}
                  className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-0"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-display text-lg text-accent/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px]">{product.name}</span>
                  </span>
                  <span className="shrink-0 text-right text-[12px] text-foreground-muted">
                    {product.quantity} vendu{product.quantity > 1 ? "s" : ""}
                    <br />
                    {formatPrice(product.revenueCents)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Planning de production */}
      <Card title="Planning de production" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {PRODUCTION_COLUMNS.map((status) => {
            const count = productionByStatus.get(status) ?? 0;
            return (
              <Link
                key={status}
                href={`/admin/commandes?statut=${status}`}
                className="border border-line p-5 transition-colors hover:border-accent/50"
              >
                <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                  {ORDER_STATUS_LABELS[status]}
                </p>
                <p className="mt-3 font-display text-3xl">{count}</p>
              </Link>
            );
          })}
        </div>
        <p className="mt-5 text-[11px] text-foreground-muted">
          Chaque colonne correspond à une étape du passage à l&apos;atelier.
          Faites évoluer le statut depuis la fiche de commande : le client est
          informé automatiquement.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card
          title="Dernières commandes"
          action={
            <Link
              href="/admin/commandes"
              className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
            >
              Tout voir
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <EmptyState message="Aucune commande pour le moment." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/commandes/${order.number}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:text-accent"
                  >
                    <span>
                      <span className="text-[13px]">{order.number}</span>
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {order.email} · {formatDate(order.createdAt)}
                      </span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-foreground-muted">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-[13px]">
                      {formatPrice(order.totalCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Alertes de stock">
          {data.lowStock.length === 0 ? (
            <EmptyState message="Aucune variante en stock critique." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {data.lowStock.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <span>
                    <span className="text-[13px]">{variant.productName}</span>
                    <span className="mt-0.5 block text-[11px] text-foreground-muted">
                      {variant.label} · {variant.sku}
                    </span>
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-[12px] ${
                      variant.stock === 0 ? "text-red-500" : "text-accent"
                    }`}
                  >
                    {variant.stock === 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {variant.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
