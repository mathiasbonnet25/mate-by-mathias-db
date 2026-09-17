"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRightLeft, Check, Loader2 } from "lucide-react";

import { convertQuoteToOrder, updateQuote } from "@/app/actions/admin-quotes";

const STATUSES = [
  { value: "NEW", label: "Nouvelle demande" },
  { value: "IN_REVIEW", label: "À l'étude" },
  { value: "SENT", label: "Devis envoyé" },
  { value: "ACCEPTED", label: "Accepté" },
  { value: "DECLINED", label: "Refusé" },
  { value: "EXPIRED", label: "Expiré" },
  { value: "CONVERTED", label: "Transformé en commande" },
] as const;

/**
 * Éditeur de devis : statut, montant, validité et note interne, puis
 * transformation en commande une fois le devis accepté.
 */
export function QuoteEditor({
  quoteId,
  status,
  quotedCents,
  estimateCents,
  internalNote,
  validUntil,
  alreadyConverted,
}: {
  quoteId: string;
  status: string;
  quotedCents: number | null;
  estimateCents: number;
  internalNote: string | null;
  validUntil: string | null;
  alreadyConverted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    status,
    quotedEuros:
      quotedCents != null
        ? (quotedCents / 100).toFixed(2)
        : (estimateCents / 100).toFixed(2),
    internalNote: internalNote ?? "",
    validUntil: validUntil ?? "",
  });

  function save() {
    setError(null);
    setFeedback(null);
    const euros = Number.parseFloat(form.quotedEuros.replace(",", "."));

    startTransition(async () => {
      const result = await updateQuote({
        quoteId,
        status: form.status,
        quotedEuros: Number.isFinite(euros) ? euros : null,
        internalNote: form.internalNote,
        validUntil: form.validUntil || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      setFeedback("Devis enregistré.");
      router.refresh();
    });
  }

  function convert() {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await convertQuoteToOrder(quoteId);
      if (!result.ok) {
        setError(result.error ?? "Conversion impossible.");
        return;
      }
      setFeedback(`Commande ${result.orderNumber} créée.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="card-soft p-6">
        <h2 className="eyebrow">Suivi du devis</h2>

        <label className="mt-5 block">
          <span className="text-[11px] text-foreground-muted">Statut</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] text-foreground-muted">
            Montant du devis (€ TTC)
          </span>
          <input
            inputMode="decimal"
            value={form.quotedEuros}
            onChange={(e) =>
              setForm((f) => ({ ...f, quotedEuros: e.target.value }))
            }
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
          />
          <span className="mt-2 block text-[11px] text-foreground-muted">
            Estimation calculée en ligne :{" "}
            {(estimateCents / 100).toFixed(2).replace(".", ",")} €. Le montant
            saisi ici remplace l&apos;estimation vis-à-vis du client.
          </span>
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] text-foreground-muted">
            Validité du devis
          </span>
          <input
            type="date"
            value={form.validUntil.slice(0, 10)}
            onChange={(e) =>
              setForm((f) => ({ ...f, validUntil: e.target.value }))
            }
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] text-foreground-muted">Note interne</span>
          <textarea
            rows={4}
            value={form.internalNote}
            maxLength={3000}
            onChange={(e) =>
              setForm((f) => ({ ...f, internalNote: e.target.value }))
            }
            className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="mt-5 inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer
        </button>
      </section>

      <section className="card-soft p-6">
        <h2 className="eyebrow">Transformer en commande</h2>
        {alreadyConverted ? (
          <p className="mt-4 text-[13px] text-foreground-muted">
            Ce devis a déjà donné lieu à une commande.
          </p>
        ) : (
          <>
            <p className="mt-4 text-[13px] leading-relaxed text-foreground-muted">
              La commande créée reprend le montant du devis et la configuration
              du projet. S&apos;agissant d&apos;une prestation nettement
              personnalisée, elle est marquée comme non soumise au droit de
              rétractation.
            </p>
            <button
              type="button"
              onClick={convert}
              disabled={pending}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
              Créer la commande
            </button>
          </>
        )}
      </section>

      {feedback && (
        <p className="flex items-center gap-2 text-[12px] text-accent" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {feedback}
        </p>
      )}
      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
