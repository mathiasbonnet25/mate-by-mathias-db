import Link from "next/link";

import { AdminHeader, Card, EmptyState, Badge } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Devis" };

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nouvelle demande",
  IN_REVIEW: "À l'étude",
  SENT: "Devis envoyé",
  ACCEPTED: "Accepté",
  DECLINED: "Refusé",
  EXPIRED: "Expiré",
  CONVERTED: "Transformé en commande",
};

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const params = await searchParams;
  const status = Object.keys(STATUS_LABELS).includes(params.statut ?? "")
    ? params.statut
    : undefined;

  const quotes = await prisma.quote.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <AdminHeader
        title="Devis"
        description="Demandes issues de l'atelier de personnalisation."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/devis"
          className={`border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            !status ? "border-accent text-accent" : "border-line hover:border-accent"
          }`}
        >
          Tous
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/devis?statut=${key}`}
            className={`border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              status === key
                ? "border-accent text-accent"
                : "border-line hover:border-accent"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card>
        {quotes.length === 0 ? (
          <EmptyState message="Aucune demande de devis." />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {quotes.map((quote) => {
              const config = quote.configuration as {
                support?: { label?: string } | null;
                paint?: { label?: string } | null;
              } | null;

              return (
                <li key={quote.id}>
                  <Link
                    href={`/admin/devis/${quote.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="min-w-48">
                      <span className="text-sm">{quote.number}</span>
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {quote.firstName} {quote.lastName} · {quote.email}
                      </span>
                    </span>

                    <span className="text-[12px] text-foreground-muted">
                      {[config?.support?.label, config?.paint?.label]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>

                    <Badge
                      tone={
                        quote.status === "NEW"
                          ? "accent"
                          : quote.status === "CONVERTED"
                            ? "success"
                            : "neutral"
                      }
                    >
                      {STATUS_LABELS[quote.status]}
                    </Badge>

                    <span className="text-right text-[13px]">
                      {quote.quotedCents != null
                        ? formatPrice(quote.quotedCents)
                        : formatPrice(quote.estimateCents)}
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {quote.quotedCents != null ? "devis" : "estimation"} ·{" "}
                        {formatDate(quote.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
