import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader, Card } from "@/components/admin/ui";
import { QuoteEditor } from "@/components/admin/quote-editor";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Détail du devis" };

type ConfigEntry = { slug?: string; label?: string; priceCents?: number };

export default async function AdminQuoteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { order: { select: { number: true } } },
  });

  if (!quote) notFound();

  const config = quote.configuration as {
    support?: ConfigEntry | null;
    paint?: ConfigEntry | null;
    finish?: ConfigEntry | null;
    extras?: ConfigEntry[] | null;
  } | null;

  return (
    <>
      <AdminHeader
        title={quote.number}
        description={`Reçue le ${formatDateTime(quote.createdAt)}`}
        action={
          <Link
            href="/admin/devis"
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
          >
            ← Tous les devis
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card title="Client">
            <dl className="space-y-2.5 text-sm">
              <Row
                label="Nom"
                value={`${quote.firstName} ${quote.lastName}`}
              />
              <Row label="Courriel" value={quote.email} />
              <Row label="Téléphone" value={quote.phone ?? "—"} />
              <Row
                label="Compte client"
                value={quote.userId ? "Oui" : "Demande sans compte"}
              />
            </dl>
          </Card>

          <Card title="Configuration du projet">
            <dl className="space-y-2.5 text-sm">
              <Row label="Pièce" value={config?.support?.label ?? "—"} />
              <Row label="Peinture" value={config?.paint?.label ?? "—"} />
              <Row label="Finition" value={config?.finish?.label ?? "—"} />
              <Row
                label="Options"
                value={
                  config?.extras?.length
                    ? config.extras.map((e) => e.label).join(", ")
                    : "Aucune"
                }
              />
              <Row
                label="Estimation en ligne"
                value={formatPrice(quote.estimateCents)}
              />
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-foreground-muted">
              L&apos;estimation affichée au client ne vaut pas devis. Le montant
              engageant est celui que vous saisissez dans le panneau de droite.
            </p>
          </Card>

          {quote.message && (
            <Card title="Message du client">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground-muted">
                {quote.message}
              </p>
            </Card>
          )}

          {quote.order && (
            <Card title="Commande associée">
              <Link
                href={`/admin/commandes/${quote.order.number}`}
                className="text-sm text-accent underline underline-offset-4"
              >
                {quote.order.number}
              </Link>
            </Card>
          )}
        </div>

        <QuoteEditor
          quoteId={quote.id}
          status={quote.status}
          quotedCents={quote.quotedCents}
          estimateCents={quote.estimateCents}
          internalNote={quote.internalNote}
          validUntil={quote.validUntil?.toISOString() ?? null}
          alreadyConverted={Boolean(quote.orderId)}
        />
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
