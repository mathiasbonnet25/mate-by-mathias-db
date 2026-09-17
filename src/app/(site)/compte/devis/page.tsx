import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mes devis",
  description: "Vos demandes de personnalisation et devis.",
  path: "/compte/devis",
  noIndex: true,
});

const STATUS_LABELS: Record<string, string> = {
  NEW: "Reçue",
  IN_REVIEW: "À l'étude",
  SENT: "Devis envoyé",
  ACCEPTED: "Accepté",
  DECLINED: "Refusé",
  EXPIRED: "Expiré",
  CONVERTED: "Transformé en commande",
};

export default async function DevisPage() {
  const session = await auth();

  const quotes = await prisma.quote.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-line p-12 text-center">
        <p className="font-display text-2xl">Aucune demande de devis</p>
        <p className="mt-3 text-sm text-foreground-muted">
          Composez votre projet dans l&apos;atelier de personnalisation.
        </p>
        <Link
          href="/personnalisation"
          className="mt-8 inline-block rounded-full border border-line px-8 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
        >
          Atelier personnalisation
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {quotes.map((quote) => {
        const config = quote.configuration as {
          support?: { label?: string } | null;
          paint?: { label?: string } | null;
          finish?: { label?: string } | null;
        } | null;

        return (
          <li key={quote.id} className="card-soft p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="font-display text-xl">{quote.number}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
                  {formatDate(quote.createdAt)} ·{" "}
                  {STATUS_LABELS[quote.status] ?? quote.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  {quote.quotedCents != null
                    ? formatPrice(quote.quotedCents)
                    : formatPrice(quote.estimateCents)}
                </p>
                <p className="mt-1 text-[11px] text-foreground-muted">
                  {quote.quotedCents != null ? "Devis" : "Estimation"}
                </p>
              </div>
            </div>

            <p className="mt-5 text-[13px] text-foreground-muted">
              {[config?.support?.label, config?.paint?.label, config?.finish?.label]
                .filter(Boolean)
                .join(" · ") || "Projet personnalisé"}
            </p>

            {quote.quotedCents == null && (
              <p className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-foreground-muted">
                Ce montant est une estimation. Un devis personnalisé sera établi
                après étude de votre projet.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
