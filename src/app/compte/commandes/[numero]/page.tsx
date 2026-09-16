import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Détail de la commande",
  description: "Détail et suivi de votre commande.",
  path: "/compte/commandes",
  noIndex: true,
});

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const session = await auth();

  // La commande est filtrée par le propriétaire : un numéro deviné ne
  // permet pas de consulter la commande d'un autre client.
  const order = await prisma.order.findFirst({
    where: { number: numero, userId: session!.user.id },
    include: {
      items: true,
      shippingAddress: true,
      invoices: true,
      events: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-12">
      <div>
        <Link
          href="/compte/commandes"
          className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
        >
          ← Toutes mes commandes
        </Link>
        <h2 className="mt-5 font-display text-3xl">{order.number}</h2>
        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-accent">
          {ORDER_STATUS_LABELS[order.status]}
        </p>
      </div>

      <section>
        <h3 className="eyebrow">Articles</h3>
        <ul className="mt-5 divide-y divide-[var(--border)] border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-5 py-4">
              <div>
                <p className="text-sm">{item.name}</p>
                <p className="mt-1 text-[11px] text-foreground-muted">
                  {item.variantLabel} · × {item.quantity}
                  {item.sku ? ` · Réf. ${item.sku}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm">{formatPrice(item.totalCents)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Sous-total" value={formatPrice(order.subtotalCents)} />
          {order.discountCents > 0 && (
            <Row
              label="Remise"
              value={`− ${formatPrice(order.discountCents)}`}
            />
          )}
          <Row label="Livraison" value={formatPrice(order.shippingCents)} />
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt>Total TTC</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
          <p className="text-[11px] text-foreground-muted">
            dont {formatPrice(order.vatCents)} de TVA
          </p>
        </dl>
      </section>

      {order.shippingAddress && (
        <section>
          <h3 className="eyebrow">Livraison</h3>
          <address className="mt-4 text-sm not-italic leading-relaxed text-foreground-muted">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 && (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            )}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
            <br />
            {order.shippingAddress.country}
          </address>

          {order.trackingNumber && (
            <p className="mt-4 text-sm">
              Suivi : {order.carrier} — {order.trackingNumber}
              {order.trackingUrl && (
                <>
                  {" "}
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-4"
                  >
                    suivre le colis
                  </a>
                </>
              )}
            </p>
          )}
        </section>
      )}

      {order.events.length > 0 && (
        <section>
          <h3 className="eyebrow">Suivi</h3>
          <ol className="mt-5 space-y-5 border-l border-line pl-6">
            {order.events.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-accent"
                  aria-hidden
                />
                <p className="text-sm">
                  {event.message ?? ORDER_STATUS_LABELS[event.status]}
                </p>
                <p className="mt-1 text-[11px] text-foreground-muted">
                  {formatDateTime(event.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {order.invoices.length > 0 && (
        <section>
          <h3 className="eyebrow">Factures</h3>
          <ul className="mt-4 space-y-2">
            {order.invoices.map((invoice) => (
              <li key={invoice.id} className="text-sm">
                {invoice.pdfUrl ? (
                  <a
                    href={invoice.pdfUrl}
                    className="text-accent underline underline-offset-4"
                  >
                    Facture {invoice.number}
                  </a>
                ) : (
                  <span className="text-foreground-muted">
                    Facture {invoice.number} — en cours d&apos;émission
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-foreground-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
