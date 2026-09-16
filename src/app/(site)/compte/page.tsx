import Link from "next/link";
import { Package, FileText, Heart, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mon compte",
  description: "Votre espace client.",
  path: "/compte",
  noIndex: true,
});

export default async function ComptePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [orders, quotes, favorites, user] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        number: true,
        status: true,
        totalCents: true,
        createdAt: true,
      },
    }),
    prisma.quote.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    }),
  ]);

  const orderCount = await prisma.order.count({ where: { userId } });

  return (
    <div className="space-y-14">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-4 w-4" aria-hidden />}
          label="Commandes"
          value={String(orderCount)}
          href="/compte/commandes"
        />
        <StatCard
          icon={<FileText className="h-4 w-4" aria-hidden />}
          label="Devis"
          value={String(quotes)}
          href="/compte/devis"
        />
        <StatCard
          icon={<Heart className="h-4 w-4" aria-hidden />}
          label="Favoris"
          value={String(favorites)}
          href="/compte/favoris"
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          label="Double authentification"
          value={user?.twoFactorEnabled ? "Activée" : "Inactive"}
          href="/compte/securite"
          highlight={!user?.twoFactorEnabled}
        />
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Dernières commandes</h2>
          <Link
            href="/compte/commandes"
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
          >
            Tout voir
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="mt-6 border border-line p-8 text-sm text-foreground-muted">
            Vous n&apos;avez pas encore passé commande.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-[var(--border)] border-y border-line">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/compte/commandes/${order.number}`}
                  className="flex flex-wrap items-center justify-between gap-4 py-5 transition-colors hover:text-accent"
                >
                  <div>
                    <p className="text-sm">{order.number}</p>
                    <p className="mt-1 text-[11px] text-foreground-muted">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm">{formatPrice(order.totalCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block border p-6 transition-colors ${
        highlight ? "border-accent/50" : "border-line hover:border-accent/50"
      }`}
    >
      <span className="text-accent">{icon}</span>
      <p className="mt-4 font-display text-2xl">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
        {label}
      </p>
    </Link>
  );
}
