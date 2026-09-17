"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Lock, Send } from "lucide-react";

import { addClaimMessageAction, updateClaimAction } from "@/app/actions/claims";
import { CLAIM_STATUS_LABELS } from "@/lib/claims";

type Statut = keyof typeof CLAIM_STATUS_LABELS;

/**
 * Traitement d'une réclamation : statut, résolution, note interne et
 * réponse au client.
 *
 * Répondre et annoter sont deux gestes distincts, jamais confondus : une
 * note interne ne part pas au client, et le bouton correspondant le dit.
 */
export function ClaimPanel({
  claimId,
  status,
  internalNote,
  resolution,
}: {
  claimId: string;
  status: Statut;
  internalNote: string | null;
  resolution: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [retour, setRetour] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const [suivi, setSuivi] = useState({
    status,
    internalNote: internalNote ?? "",
    resolution: resolution ?? "",
  });
  const [message, setMessage] = useState("");

  function lancer(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    succes: string,
    apres?: () => void,
  ) {
    setErreur(null);
    setRetour(null);
    startTransition(async () => {
      const resultat = await fn();
      if (!resultat.ok) {
        setErreur(resultat.error ?? "Opération impossible.");
        return;
      }
      setRetour(succes);
      apres?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="card-soft p-6">
        <h2 className="eyebrow">Suivi du dossier</h2>

        <label className="mt-5 block">
          <span className="text-[11px] text-foreground-muted">Statut</span>
          <select
            value={suivi.status}
            onChange={(e) =>
              setSuivi((s) => ({ ...s, status: e.target.value as Statut }))
            }
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
          >
            {(Object.keys(CLAIM_STATUS_LABELS) as Statut[]).map((s) => (
              <option key={s} value={s}>
                {CLAIM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] text-foreground-muted">
            Résolution apportée
          </span>
          <textarea
            rows={4}
            maxLength={5000}
            value={suivi.resolution}
            onChange={(e) =>
              setSuivi((s) => ({ ...s, resolution: e.target.value }))
            }
            placeholder="Remplacement expédié le 12 mars, colis 1Z999…"
            className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] text-foreground-muted">
            Note interne
          </span>
          <textarea
            rows={3}
            maxLength={5000}
            value={suivi.internalNote}
            onChange={(e) =>
              setSuivi((s) => ({ ...s, internalNote: e.target.value }))
            }
            className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
          />
          <span className="mt-2 block text-[11px] text-foreground-muted">
            Visible par l&apos;atelier seulement. N&apos;y consignez aucune
            donnée sensible inutile.
          </span>
        </label>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            lancer(
              () => updateClaimAction({ claimId, ...suivi }),
              "Dossier enregistré.",
            )
          }
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-7 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer
        </button>
      </section>

      <section className="card-soft p-6">
        <h2 className="eyebrow">Ajouter au fil</h2>

        <textarea
          rows={5}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message…"
          className="mt-5 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || !message.trim()}
            onClick={() =>
              lancer(
                () =>
                  addClaimMessageAction({ claimId, body: message, isInternal: false }),
                "Réponse ajoutée au dossier.",
                () => setMessage(""),
              )
            }
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-[11px] uppercase tracking-[0.16em] text-accent-contrast transition-all hover:brightness-110 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Répondre au client
          </button>

          <button
            type="button"
            disabled={pending || !message.trim()}
            onClick={() =>
              lancer(
                () =>
                  addClaimMessageAction({ claimId, body: message, isInternal: true }),
                "Note interne ajoutée.",
                () => setMessage(""),
              )
            }
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Note interne
          </button>
        </div>
      </section>

      {retour && (
        <p className="flex items-center gap-2 text-[12px] text-accent" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {retour}
        </p>
      )}
      {erreur && (
        <p className="text-[12px] text-red-500" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
