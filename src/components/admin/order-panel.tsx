"use client";

import { useState, useTransition } from "react";
import { Check, FileText, Loader2, Printer } from "lucide-react";

import {
  issueInvoice,
  updateOrderNote,
  updateOrderShipping,
  updateOrderStatus,
} from "@/app/actions/admin-orders";
import { ORDER_STATUS_LABELS } from "@/lib/orders";

type OrderStatusKey = keyof typeof ORDER_STATUS_LABELS;

/**
 * Panneau de gestion d'une commande : statut, expédition, note interne et
 * émission de la facture.
 */
export function OrderPanel({
  orderId,
  status,
  carrier,
  trackingNumber,
  trackingUrl,
  internalNote,
  hasInvoice,
  canInvoice,
}: {
  orderId: string;
  status: OrderStatusKey;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  internalNote: string | null;
  hasInvoice: boolean;
  canInvoice: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<OrderStatusKey>(status);
  const [statusMessage, setStatusMessage] = useState("");
  const [notify, setNotify] = useState(true);

  const [shipping, setShipping] = useState({
    carrier: carrier ?? "",
    trackingNumber: trackingNumber ?? "",
    trackingUrl: trackingUrl ?? "",
  });
  const [note, setNote] = useState(internalNote ?? "");

  function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Opération impossible.");
        return;
      }
      setFeedback(successMessage);
    });
  }

  return (
    <div className="space-y-4">
      <section className="border border-line bg-surface p-6">
        <h2 className="eyebrow">Statut</h2>

        <label className="mt-5 block">
          <span className="text-[11px] text-foreground-muted">
            Nouvelle étape
          </span>
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatusKey)}
            className="mt-2 h-11 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
          >
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatusKey[]).map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] text-foreground-muted">
            Message associé (facultatif)
          </span>
          <input
            value={statusMessage}
            maxLength={500}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="Mise en peinture démarrée"
            className="mt-2 h-11 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[12px] text-foreground-muted">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-[3px] h-3.5 w-3.5 accent-[var(--accent)]"
          />
          Rendre cette étape visible par le client dans son suivi
        </label>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                updateOrderStatus({
                  orderId,
                  status: nextStatus,
                  message: statusMessage,
                  notifyCustomer: notify,
                }),
              "Statut mis à jour.",
            )
          }
          className="mt-5 inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer le statut
        </button>
      </section>

      <section className="border border-line bg-surface p-6">
        <h2 className="eyebrow">Expédition</h2>

        <div className="mt-5 space-y-4">
          <Field
            label="Transporteur"
            value={shipping.carrier}
            onChange={(v) => setShipping((s) => ({ ...s, carrier: v }))}
          />
          <Field
            label="Numéro de suivi"
            value={shipping.trackingNumber}
            onChange={(v) => setShipping((s) => ({ ...s, trackingNumber: v }))}
          />
          <Field
            label="Lien de suivi"
            value={shipping.trackingUrl}
            onChange={(v) => setShipping((s) => ({ ...s, trackingUrl: v }))}
            placeholder="https://…"
          />
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => updateOrderShipping({ orderId, ...shipping }),
              "Informations d'expédition enregistrées.",
            )
          }
          className="mt-5 inline-flex h-11 items-center gap-2 border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Enregistrer
        </button>
      </section>

      <section className="border border-line bg-surface p-6">
        <h2 className="eyebrow">Note interne</h2>
        <p className="mt-2 text-[11px] text-foreground-muted">
          Visible uniquement par l&apos;atelier. N&apos;y consignez aucune
          donnée sensible inutile.
        </p>
        <textarea
          rows={4}
          value={note}
          maxLength={3000}
          onChange={(e) => setNote(e.target.value)}
          className="mt-4 w-full border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => updateOrderNote({ orderId, internalNote: note }),
              "Note enregistrée.",
            )
          }
          className="mt-3 inline-flex h-11 items-center gap-2 border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Enregistrer
        </button>
      </section>

      <section className="border border-line bg-surface p-6">
        <h2 className="eyebrow">Facture</h2>
        {hasInvoice ? (
          <p className="mt-4 text-[13px] text-foreground-muted">
            Une facture a déjà été émise pour cette commande. La numérotation
            étant continue, elle ne peut être ni supprimée ni renumérotée.
          </p>
        ) : (
          <>
            <p className="mt-4 text-[13px] text-foreground-muted">
              {canInvoice
                ? "La commande est encaissée : la facture peut être émise."
                : "La facture ne peut être émise qu'après encaissement du paiement."}
            </p>
            <button
              type="button"
              disabled={pending || !canInvoice}
              onClick={() => run(() => issueInvoice(orderId), "Facture émise.")}
              className="mt-4 inline-flex h-11 items-center gap-2 border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Émettre la facture
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className="ml-2 mt-4 inline-flex h-11 items-center gap-2 border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Imprimer
        </button>
      </section>

      {feedback && (
        <p
          className="flex items-center gap-2 text-[12px] text-accent"
          role="status"
        >
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-foreground-muted">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
