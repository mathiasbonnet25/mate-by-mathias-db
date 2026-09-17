"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { updateDataRequest } from "@/app/actions/admin-content";
import { formatDate } from "@/lib/utils";

export type DataRequestRow = {
  id: string;
  type: string;
  status: string;
  email: string;
  message: string | null;
  createdAt: string;
  dueAt: string;
  resolvedAt: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  ACCESS: "Accès",
  RECTIFICATION: "Rectification",
  ERASURE: "Effacement",
  PORTABILITY: "Portabilité",
  OBJECTION: "Opposition",
  RESTRICTION: "Limitation",
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Reçue",
  IDENTITY_PENDING: "Identité à vérifier",
  IN_PROGRESS: "En cours",
  COMPLETED: "Traitée",
  REJECTED: "Rejetée",
};

/**
 * Suivi des demandes d'exercice des droits. Le RGPD impose une réponse dans
 * le mois : l'échéance est affichée et signalée dès qu'elle approche.
 */
export function DataRequestPanel({ requests }: { requests: DataRequestRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <p className="border border-dashed border-line p-8 text-center text-sm text-foreground-muted">
        Aucune demande en cours.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const due = new Date(request.dueAt);
        const daysLeft = Math.ceil(
          (due.getTime() - Date.now()) / 86_400_000,
        );
        const urgent =
          !request.resolvedAt && daysLeft <= 7 && request.status !== "COMPLETED";

        return (
          <div
            key={request.id}
            className={`border p-5 ${urgent ? "border-accent" : "border-line"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm">
                  {TYPE_LABELS[request.type] ?? request.type} — {request.email}
                </p>
                <p className="mt-1 text-[11px] text-foreground-muted">
                  Reçue le {formatDate(request.createdAt)} · Échéance légale le{" "}
                  {formatDate(request.dueAt)}
                  {!request.resolvedAt && (
                    <span className={urgent ? "text-accent" : ""}>
                      {" "}
                      · {daysLeft > 0 ? `${daysLeft} jour(s) restant(s)` : "échéance dépassée"}
                    </span>
                  )}
                </p>
              </div>

              <span className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
                {STATUS_LABELS[request.status] ?? request.status}
              </span>
            </div>

            {request.message && (
              <p className="mt-4 whitespace-pre-line border-t border-line pt-4 text-[13px] leading-relaxed text-foreground-muted">
                {request.message}
              </p>
            )}

            {open === request.id ? (
              <div className="mt-5 border-t border-line pt-5">
                <label className="block">
                  <span className="eyebrow">Réponse apportée</span>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          setError(null);
                          const result = await updateDataRequest({
                            requestId: request.id,
                            status: key,
                            resolution,
                          });
                          if (!result.ok) {
                            setError(result.error ?? "Enregistrement impossible.");
                            return;
                          }
                          setOpen(null);
                          setResolution("");
                          router.refresh();
                        })
                      }
                      className="rounded-full border border-line px-5 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      {pending ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : (
                        label
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="px-3 text-[11px] uppercase tracking-[0.12em] text-foreground-muted"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(request.id);
                  setResolution("");
                }}
                className="mt-4 text-[11px] uppercase tracking-[0.14em] text-accent"
              >
                Traiter cette demande
              </button>
            )}
          </div>
        );
      })}

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
