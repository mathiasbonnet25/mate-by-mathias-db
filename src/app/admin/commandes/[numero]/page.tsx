import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader, Card, Badge } from "@/components/admin/ui";
import { OrderPanel } from "@/components/admin/order-panel";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatDateTime, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Détail de la commande" };

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;

  const order = await prisma.order.findUnique({
    where: { number: numero },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
      payments: true,
      invoices: true,
      events: { orderBy: { createdAt: "desc" } },
      quote: { select: { number: true } },
    },
  });

  if (!order) notFound();

  return (
    <>
      <AdminHeader
        title={order.number}
        description={`Passée le ${formatDateTime(order.createdAt)} par ${order.email}`}
        action={
          <Link
            href="/admin/commandes"
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
          >
            ← Toutes les commandes
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card title="Articles">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-3 text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted">
                    Produit
                  </th>
                  <th className="pb-3 text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted">
                    Qté
                  </th>
                  <th className="pb-3 text-right text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-0">
                    <td className="py-3.5 pr-4">
                      {item.name}
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {item.variantLabel}
                        {item.sku ? ` · ${item.sku}` : ""}
                      </span>
                    </td>
                    <td className="py-3.5">{item.quantity}</td>
                    <td className="py-3.5 text-right">
                      {formatPrice(item.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <Row label="Sous-total" value={formatPrice(order.subtotalCents)} />
              {order.discountCents > 0 && (
                <Row
                  label={`Remise${order.discountCode ? ` (${order.discountCode})` : ""}`}
                  value={`− ${formatPrice(order.discountCents)}`}
                />
              )}
              <Row label="Livraison" value={formatPrice(order.shippingCents)} />
              <Row label="dont TVA" value={formatPrice(order.vatCents)} />
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt>Total TTC</dt>
                <dd>{formatPrice(order.totalCents)}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Livraison">
              {order.shippingAddress ? (
                <address className="text-sm not-italic leading-relaxed text-foreground-muted">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
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
                  {order.shippingAddress.phone && (
                    <>
                      <br />
                      {order.shippingAddress.phone}
                    </>
                  )}
                </address>
              ) : (
                <p className="text-sm text-foreground-muted">Non renseignée.</p>
              )}
            </Card>

            <Card title="Facturation">
              {order.billingAddress ? (
                <address className="text-sm not-italic leading-relaxed text-foreground-muted">
                  {order.billingAddress.firstName} {order.billingAddress.lastName}
                  <br />
                  {order.billingAddress.line1}
                  <br />
                  {order.billingAddress.postalCode} {order.billingAddress.city}
                  <br />
                  {order.billingAddress.country}
                </address>
              ) : (
                <p className="text-sm text-foreground-muted">
                  Identique à la livraison.
                </p>
              )}
            </Card>
          </div>

          <Card title="Paiement">
            {order.payments.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                Aucun encaissement enregistré.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                  >
                    <span>
                      {payment.provider} · {payment.status}
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {payment.cardBrand
                          ? `${payment.cardBrand} •••• ${payment.cardLast4}`
                          : "Aucune donnée de carte conservée"}
                      </span>
                    </span>
                    <span>{formatPrice(payment.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}

            {order.withdrawalWaived && (
              <p className="mt-5 border border-accent/40 p-4 text-[12px] leading-relaxed">
                Le client a expressément demandé l&apos;exécution des travaux et
                reconnu la perte de son droit de rétractation pour les pièces
                personnalisées.
              </p>
            )}
          </Card>

          {order.customerNote && (
            <Card title="Message du client">
              <p className="whitespace-pre-line text-sm text-foreground-muted">
                {order.customerNote}
              </p>
            </Card>
          )}

          <Card title="Historique">
            <ol className="space-y-4 border-l border-line pl-5">
              {order.events.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-accent"
                    aria-hidden
                  />
                  <p className="text-sm">
                    {event.message ?? ORDER_STATUS_LABELS[event.status]}
                  </p>
                  <p className="mt-1 text-[11px] text-foreground-muted">
                    {formatDateTime(event.createdAt)}
                    {event.createdBy ? ` · ${event.createdBy}` : ""}
                    {!event.isPublic ? " · interne" : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="accent">{ORDER_STATUS_LABELS[order.status]}</Badge>
            <Badge
              tone={order.paymentStatus === "PAID" ? "success" : "neutral"}
            >
              Paiement : {order.paymentStatus}
            </Badge>
            {order.quote && (
              <Badge>Issue du devis {order.quote.number}</Badge>
            )}
          </div>

          <OrderPanel
            orderId={order.id}
            status={order.status}
            carrier={order.carrier}
            trackingNumber={order.trackingNumber}
            trackingUrl={order.trackingUrl}
            internalNote={order.internalNote}
            hasInvoice={order.invoices.length > 0}
            canInvoice={order.paymentStatus === "PAID"}
          />
        </div>
      </div>
    </>
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
