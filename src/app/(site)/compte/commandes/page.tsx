import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mes commandes",
  description: "Historique et suivi de vos commandes.",
  path: "/compte/commandes",
  noIndex: true,
});

export default async function CommandesPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { name: true, quantity: true } },
      invoices: { select: { number: true, pdfUrl: true } },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-line p-12 text-center">
        <p className="font-display text-2xl">Aucune commande</p>
        <p className="mt-3 text-sm text-foreground-muted">
          Vos commandes apparaîtront ici dès votre premier achat.
        </p>
        <Link
          href="/velos"
          className="mt-8 inline-block rounded-full border border-line px-8 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
        >
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="card-soft p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-display text-xl">{order.number}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
                {formatDate(order.createdAt)} ·{" "}
                {ORDER_STATUS_LABELS[order.status]}
              </p>
            </div>
            <p className="text-sm">{formatPrice(order.totalCents)}</p>
          </div>

          <ul className="mt-5 space-y-1 text-[13px] text-foreground-muted">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-line pt-5">
            <Link
              href={`/compte/commandes/${order.number}`}
              className="text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-accent"
            >
              Détail et suivi
            </Link>
            {order.invoices[0]?.pdfUrl && (
              <a
                href={order.invoices[0].pdfUrl}
                className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-accent"
              >
                Facture {order.invoices[0].number}
              </a>
            )}
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] uppercase tracking-[0.14em] text-accent"
              >
                Suivre le colis
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
