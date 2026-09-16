import { AdminHeader, Card, Stat, EmptyState } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/sales-chart";
import { getDashboardData } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Statistiques" };

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const params = await searchParams;
  const days = [7, 30, 90, 365].includes(Number(params.periode))
    ? Number(params.periode)
    : 30;

  const [data, topPages, devices] = await Promise.all([
    getDashboardData(days),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } },
      _count: true,
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.pageView.groupBy({
      by: ["device"],
      where: { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } },
      _count: true,
    }),
  ]);

  const totalDeviceViews = devices.reduce((s, d) => s + d._count, 0);

  return (
    <>
      <AdminHeader
        title="Statistiques"
        description="Mesure d'audience interne, sans cookie tiers. Les visiteurs sont comptés par un identifiant journalier haché, non réversible et non persistant."
      />

      <div className="mb-4 flex gap-2">
        {[
          { value: 7, label: "7 jours" },
          { value: 30, label: "30 jours" },
          { value: 90, label: "90 jours" },
          { value: 365, label: "12 mois" },
        ].map((option) => (
          <a
            key={option.value}
            href={`/admin/statistiques?periode=${option.value}`}
            className={`border px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              days === option.value
                ? "border-accent text-accent"
                : "border-line hover:border-accent"
            }`}
          >
            {option.label}
          </a>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Visiteurs uniques" value={String(data.uniqueVisitors)} />
        <Stat label="Pages vues" value={String(data.pageViews)} />
        <Stat
          label="Chiffre d'affaires"
          value={formatPrice(data.revenueCents)}
        />
        <Stat label="Panier moyen" value={formatPrice(data.averageBasketCents)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Commandes" value={String(data.orderCount)} />
        <Stat label="Commandes payées" value={String(data.paidOrders)} />
        <Stat label="Taux de conversion" value={`${data.conversionRate} %`} />
        <Stat label="Devis en attente" value={String(data.pendingQuotes)} />
      </div>

      <Card title="Chiffre d'affaires" className="mt-4">
        {data.salesSeries.every((p) => p.cents === 0) ? (
          <EmptyState message="Aucune vente sur la période." />
        ) : (
          <SalesChart data={data.salesSeries} />
        )}
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Pages les plus consultées" className="xl:col-span-2">
          {topPages.length === 0 ? (
            <EmptyState message="Aucune donnée d'audience. La mesure ne démarre qu'après consentement du visiteur." />
          ) : (
            <ul className="space-y-3">
              {topPages.map((page) => (
                <li
                  key={page.path}
                  className="flex items-center justify-between gap-4 border-b border-line pb-2.5 last:border-0"
                >
                  <span className="truncate text-[13px]">{page.path}</span>
                  <span className="shrink-0 text-[12px] text-foreground-muted">
                    {page._count} vue{page._count > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Appareils">
          {devices.length === 0 ? (
            <EmptyState message="Aucune donnée." />
          ) : (
            <ul className="space-y-4">
              {devices.map((device) => {
                const share = Math.round((device._count / totalDeviceViews) * 100);
                return (
                  <li key={device.device ?? "inconnu"}>
                    <div className="flex justify-between text-[12px]">
                      <span>{device.device ?? "Inconnu"}</span>
                      <span className="text-foreground-muted">{share} %</span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-surface-muted">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Meilleures ventes" className="mt-4">
        {data.topProducts.length === 0 ? (
          <EmptyState message="Aucune vente sur la période." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-3 text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted">
                  Produit
                </th>
                <th className="pb-3 text-right text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted">
                  Quantité
                </th>
                <th className="pb-3 text-right text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted">
                  Chiffre d&apos;affaires
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((product, index) => (
                <tr
                  key={`${product.productId}-${index}`}
                  className="border-b border-line last:border-0"
                >
                  <td className="py-3">{product.name}</td>
                  <td className="py-3 text-right">{product.quantity}</td>
                  <td className="py-3 text-right">
                    {formatPrice(product.revenueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="mt-6 text-[11px] leading-relaxed text-foreground-muted">
        Les vues de page sont conservées treize mois au maximum, conformément
        à la durée recommandée par la CNIL pour la mesure d&apos;audience, puis
        supprimées automatiquement.
      </p>
    </>
  );
}
