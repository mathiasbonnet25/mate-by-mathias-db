import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { AdminHeader, Card, Badge } from "@/components/admin/ui";
import { ClaimPanel } from "@/components/admin/claim-panel";
import { prisma } from "@/lib/prisma";
import {
  CLAIM_OPEN_STATUSES,
  CLAIM_REASON_LABELS,
  CLAIM_STATUS_LABELS,
  claimDueDate,
} from "@/lib/claims";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Détail de la réclamation" };

type PieceJointe = { url: string; fileName: string; mimeType: string };

function piecesJointes(valeur: unknown): PieceJointe[] {
  if (!Array.isArray(valeur)) return [];
  return valeur.flatMap((v) =>
    v && typeof v === "object" && "url" in v
      ? [
          {
            url: String((v as Record<string, unknown>).url),
            fileName: String((v as Record<string, unknown>).fileName ?? "pièce"),
            mimeType: String((v as Record<string, unknown>).mimeType ?? ""),
          },
        ]
      : [],
  );
}

export default async function AdminClaimDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dossier = await prisma.claim.findUnique({
    where: { id },
    include: {
      order: { select: { number: true, totalCents: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!dossier) notFound();

  const pieces = piecesJointes(dossier.attachments);
  const ouvert = CLAIM_OPEN_STATUSES.includes(dossier.status);
  const echeance = claimDueDate(dossier.createdAt);
  const retard = ouvert && echeance < new Date();

  return (
    <>
      <AdminHeader
        title={dossier.number}
        description={`Déposée le ${formatDateTime(dossier.createdAt)} par ${dossier.firstName} ${dossier.lastName}`}
        action={
          <Link
            href="/admin/reclamations"
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
          >
            ← Toutes les réclamations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={retard ? "danger" : ouvert ? "accent" : "success"}>
          {CLAIM_STATUS_LABELS[dossier.status]}
        </Badge>
        <Badge>{CLAIM_REASON_LABELS[dossier.reason]}</Badge>
        {ouvert && (
          <Badge tone={retard ? "danger" : "neutral"}>
            {retard
              ? `Échéance dépassée depuis le ${formatDate(echeance)}`
              : `Réponse attendue avant le ${formatDate(echeance)}`}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card title="Client">
            <dl className="space-y-2.5 text-sm">
              <Ligne
                label="Nom"
                valeur={`${dossier.firstName} ${dossier.lastName}`}
              />
              <Ligne label="Courriel" valeur={dossier.email} />
              <Ligne label="Téléphone" valeur={dossier.phone ?? "—"} />
              <Ligne
                label="Compte client"
                valeur={dossier.userId ? "Oui" : "Dépôt sans compte"}
              />
            </dl>
          </Card>

          <Card title="Commande concernée">
            {dossier.order ? (
              <Link
                href={`/admin/commandes/${dossier.order.number}`}
                className="text-sm text-accent underline underline-offset-4"
              >
                {dossier.order.number}
              </Link>
            ) : dossier.orderNumber ? (
              <p className="text-sm text-foreground-muted">
                Numéro saisi :{" "}
                <strong className="text-foreground">{dossier.orderNumber}</strong>{" "}
                — aucune commande ne correspond. Vérifiez la saisie auprès du
                client.
              </p>
            ) : (
              <p className="text-sm text-foreground-muted">
                Aucun numéro de commande renseigné.
              </p>
            )}
          </Card>

          <Card title="Demande initiale">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground-muted">
              {dossier.description}
            </p>

            {pieces.length > 0 && (
              <>
                <h3 className="eyebrow mt-7">Pièces jointes</h3>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {pieces.map((p) => (
                    <li key={p.url}>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-24 w-24 overflow-hidden rounded-sm border border-line transition-colors hover:border-accent"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt={p.fileName}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card title="Fil du dossier">
            <ol className="space-y-5">
              {dossier.messages.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-md border p-5 ${
                    m.isInternal
                      ? "border-dashed border-line bg-surface-muted"
                      : m.author === "CLIENT"
                        ? "border-line"
                        : "border-accent/40 bg-accent/[0.04]"
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
                    {m.isInternal && (
                      <Lock className="h-3 w-3 text-accent" aria-hidden />
                    )}
                    {m.isInternal
                      ? "Note interne"
                      : m.author === "CLIENT"
                        ? "Client"
                        : "Atelier"}
                    <span aria-hidden>·</span>
                    {formatDateTime(m.createdAt)}
                    {m.authorName ? ` · ${m.authorName}` : ""}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                    {m.body}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          {dossier.resolution && (
            <Card title="Résolution">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground-muted">
                {dossier.resolution}
              </p>
              {dossier.resolvedAt && (
                <p className="mt-4 text-[11px] text-foreground-muted">
                  Clos le {formatDateTime(dossier.resolvedAt)}
                </p>
              )}
            </Card>
          )}
        </div>

        <ClaimPanel
          claimId={dossier.id}
          status={dossier.status}
          internalNote={dossier.internalNote}
          resolution={dossier.resolution}
        />
      </div>
    </>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-right">{valeur}</dd>
    </div>
  );
}
