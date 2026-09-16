import { AdminHeader, Card, Stat } from "@/components/admin/ui";
import {
  DataRequestPanel,
  TrackerPanel,
  type DataRequestRow,
  type TrackerRow,
} from "@/components/admin/compliance-panels";
import { prisma } from "@/lib/prisma";
import { COOKIE_POLICY_VERSION } from "@/lib/consent";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Conformité" };

export default async function AdminCompliancePage() {
  const [categories, requests, consents, recentConsents, auditLogs, openRequests] =
    await Promise.all([
      prisma.cookieCategory.findMany({
        orderBy: { position: "asc" },
        include: { trackers: { orderBy: { name: "asc" } } },
      }),
      prisma.dataRequest.findMany({
        orderBy: [{ resolvedAt: "asc" }, { dueAt: "asc" }],
        take: 50,
      }),
      prisma.consentRecord.count(),
      prisma.consentRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.dataRequest.count({
        where: { status: { notIn: ["COMPLETED", "REJECTED"] } },
      }),
    ]);

  const trackers: TrackerRow[] = categories.flatMap((category) =>
    category.trackers.map((tracker) => ({
      id: tracker.id,
      name: tracker.name,
      vendor: tracker.vendor,
      purpose: tracker.purpose,
      retention: tracker.retention,
      recipientCountry: tracker.recipientCountry,
      isActive: tracker.isActive,
      categoryName: category.name,
      isEssential: category.isEssential,
    })),
  );

  const requestRows: DataRequestRow[] = requests.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    email: r.email,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    dueAt: r.dueAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
  }));

  return (
    <>
      <AdminHeader
        title="Conformité"
        description="Traceurs, preuves de consentement, demandes relatives aux données personnelles et journal des actions d'administration."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Demandes RGPD ouvertes"
          value={String(openRequests)}
          hint="Délai légal de réponse : un mois"
        />
        <Stat
          label="Preuves de consentement"
          value={String(consents)}
          hint="Horodatées, sans IP en clair"
        />
        <Stat label="Traceurs déclarés" value={String(trackers.length)} />
        <Stat
          label="Politique de cookies"
          value={COOKIE_POLICY_VERSION}
          hint="À incrémenter à chaque changement de fond"
        />
      </div>

      <Card title="Traceurs et coupe-circuit" className="mt-4">
        <p className="mb-5 text-[12px] leading-relaxed text-foreground-muted">
          Chaque outil tiers doit être déclaré ici : il apparaît alors dans la
          politique de cookies avec sa finalité et sa durée de conservation. Le
          bouton permet de couper immédiatement un traceur jugé non conforme,
          sans attendre un déploiement.
        </p>
        <TrackerPanel trackers={trackers} />
      </Card>

      <Card title="Demandes relatives aux données personnelles" className="mt-4">
        <DataRequestPanel requests={requestRows} />
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Derniers consentements enregistrés">
          <ul className="space-y-3 text-[12px]">
            {recentConsents.length === 0 ? (
              <li className="text-foreground-muted">
                Aucun consentement enregistré pour l&apos;instant.
              </li>
            ) : (
              recentConsents.map((consent) => {
                const choices = consent.choices as Record<string, boolean>;
                const accepted = Object.entries(choices)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(", ");
                return (
                  <li
                    key={consent.id}
                    className="border-b border-line pb-2.5 last:border-0"
                  >
                    <p>{formatDateTime(consent.createdAt)}</p>
                    <p className="mt-0.5 text-foreground-muted">
                      {consent.origin} · v{consent.policyVersion} · accepté :{" "}
                      {accepted || "aucune catégorie facultative"}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-foreground-muted">
            Ces enregistrements constituent la preuve du consentement exigée par
            l&apos;article 7.1 du RGPD. Ils ne contiennent aucune adresse IP en
            clair : seul un condensat salé est conservé.
          </p>
        </Card>

        <Card title="Journal des actions d'administration">
          <ul className="space-y-3 text-[12px]">
            {auditLogs.length === 0 ? (
              <li className="text-foreground-muted">Aucune action enregistrée.</li>
            ) : (
              auditLogs.map((log) => (
                <li key={log.id} className="border-b border-line pb-2.5 last:border-0">
                  <p>
                    <span
                      className={
                        log.severity === "CRITICAL"
                          ? "text-red-500"
                          : log.severity === "WARNING"
                            ? "text-accent"
                            : ""
                      }
                    >
                      {log.action}
                    </span>
                    {log.entity ? ` · ${log.entity}` : ""}
                  </p>
                  <p className="mt-0.5 text-foreground-muted">
                    {formatDateTime(log.createdAt)}
                    {log.actorEmail ? ` · ${log.actorEmail}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
