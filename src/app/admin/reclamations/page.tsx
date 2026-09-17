import Link from "next/link";
import type { ClaimStatus, Prisma } from "@prisma/client";

import { AdminHeader, Card, EmptyState, Badge } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import {
  CLAIM_OPEN_STATUSES,
  CLAIM_REASON_LABELS,
  CLAIM_STATUS_LABELS,
  claimDueDate,
} from "@/lib/claims";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Réclamations" };

const STATUTS = Object.keys(CLAIM_STATUS_LABELS) as ClaimStatus[];

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const params = await searchParams;
  const statut = STATUTS.includes(params.statut as ClaimStatus)
    ? (params.statut as ClaimStatus)
    : undefined;
  const recherche = params.q?.trim().slice(0, 120);

  const where: Prisma.ClaimWhereInput = {
    ...(statut ? { status: statut } : {}),
    ...(recherche
      ? {
          OR: [
            { number: { contains: recherche, mode: "insensitive" } },
            { email: { contains: recherche, mode: "insensitive" } },
            { orderNumber: { contains: recherche, mode: "insensitive" } },
            { lastName: { contains: recherche, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [dossiers, ouverts, enRetard] = await Promise.all([
    prisma.claim.findMany({
      where,
      // Les dossiers non tranchés d'abord, puis du plus ancien au plus
      // récent : c'est celui qui attend depuis le plus longtemps qui
      // doit remonter, pas le dernier arrivé.
      orderBy: [{ resolvedAt: "asc" }, { createdAt: "asc" }],
      take: 100,
      include: { _count: { select: { messages: true } } },
    }),
    prisma.claim.count({ where: { status: { in: CLAIM_OPEN_STATUSES } } }),
    prisma.claim.count({
      where: {
        status: { in: CLAIM_OPEN_STATUSES },
        createdAt: { lt: new Date(Date.now() - 15 * 86_400_000) },
      },
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Réclamations"
        description={`${ouverts} dossier${ouverts > 1 ? "s" : ""} ouvert${ouverts > 1 ? "s" : ""}.${
          enRetard > 0
            ? ` ${enRetard} au-delà des quinze jours d'engagement de réponse.`
            : ""
        }`}
      />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-4" method="get">
          <label className="min-w-56 flex-1">
            <span className="eyebrow">Recherche</span>
            <input
              name="q"
              defaultValue={recherche ?? ""}
              placeholder="Dossier, courriel, commande ou nom"
              className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            />
          </label>

          <label>
            <span className="eyebrow">Statut</span>
            <select
              name="statut"
              defaultValue={statut ?? ""}
              className="mt-2 h-11 rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            >
              <option value="">Tous</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {CLAIM_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="h-11 rounded-full bg-foreground px-7 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Filtrer
          </button>

          {(statut || recherche) && (
            <Link
              href="/admin/reclamations"
              className="pb-3 text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
            >
              Réinitialiser
            </Link>
          )}
        </form>
      </Card>

      <Card>
        {dossiers.length === 0 ? (
          <EmptyState message="Aucune réclamation ne correspond à ces critères." />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {dossiers.map((d) => {
              const ouvert = CLAIM_OPEN_STATUSES.includes(d.status);
              const echeance = claimDueDate(d.createdAt);
              const retard = ouvert && echeance < new Date();

              return (
                <li key={d.id}>
                  <Link
                    href={`/admin/reclamations/${d.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="min-w-52">
                      <span className="text-sm">{d.number}</span>
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        {d.firstName} {d.lastName} · {d.email}
                      </span>
                    </span>

                    <span className="text-[12px] text-foreground-muted">
                      {CLAIM_REASON_LABELS[d.reason]}
                      {d.orderNumber ? ` · ${d.orderNumber}` : ""}
                    </span>

                    <Badge
                      tone={
                        retard
                          ? "danger"
                          : d.status === "RESOLVED"
                            ? "success"
                            : ouvert
                              ? "accent"
                              : "neutral"
                      }
                    >
                      {CLAIM_STATUS_LABELS[d.status]}
                    </Badge>

                    <span className="w-40 text-right text-[11px] text-foreground-muted">
                      {formatDate(d.createdAt)}
                      <span className="mt-0.5 block">
                        {retard
                          ? "échéance dépassée"
                          : `${d._count.messages} échange${d._count.messages > 1 ? "s" : ""}`}
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
