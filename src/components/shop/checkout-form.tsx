"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import type { CartView } from "@/lib/cart";

type AddressState = {
  firstName: string;
  lastName: string;
  company: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
};

const EMPTY: AddressState = {
  firstName: "",
  lastName: "",
  company: "",
  line1: "",
  line2: "",
  postalCode: "",
  city: "",
  country: "FR",
  phone: "",
};

const COUNTRIES = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "LU", label: "Luxembourg" },
  { code: "ES", label: "Espagne" },
  { code: "IT", label: "Italie" },
  { code: "DE", label: "Allemagne" },
];

/**
 * Tunnel de commande.
 *
 * Le formulaire ne collecte aucune donnée bancaire : la saisie de la carte a
 * lieu sur les pages hébergées par Stripe. Les CGV doivent être acceptées
 * explicitement, et le client reconnaît le caractère non rétractable des
 * pièces personnalisées lorsque sa commande en contient.
 */
export function CheckoutForm({
  cart,
  defaultEmail,
}: {
  cart: CartView;
  defaultEmail?: string | null;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [shipping, setShipping] = useState<AddressState>(EMPTY);
  const [billing, setBilling] = useState<AddressState>(EMPTY);
  const [sameBilling, setSameBilling] = useState(true);
  const [note, setNote] = useState("");
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [waiver, setWaiver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Une commande contenant une pièce faite sur mesure appelle une
  // renonciation expresse au droit de rétractation.
  const hasMadeToOrder = cart.items.some((i) => i.stock <= 0 && i.allowBackorder);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!acceptsTerms) {
      setError("Merci d'accepter les conditions générales de vente.");
      return;
    }
    if (hasMadeToOrder && !waiver) {
      setError(
        "Merci de confirmer votre demande d'exécution pour les pièces personnalisées.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: shipping.phone || null,
          shipping,
          billing: sameBilling ? null : billing,
          customerNote: note || null,
          acceptsTerms: true,
          withdrawalWaived: hasMadeToOrder ? waiver : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Commande impossible.");
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "La commande n'a pas abouti.",
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16"
      noValidate
    >
      <div className="space-y-12">
        <fieldset>
          <legend className="font-display text-2xl">Vos coordonnées</legend>
          <div className="mt-6">
            <Field
              label="Adresse électronique"
              type="email"
              required
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <p className="mt-2 text-[11px] text-foreground-muted">
              Elle sert à vous transmettre la confirmation, la facture et le
              suivi d&apos;expédition.
            </p>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl">Adresse de livraison</legend>
          <AddressFields
            value={shipping}
            onChange={setShipping}
            prefix="shipping"
          />
        </fieldset>

        <fieldset>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={sameBilling}
              onChange={(e) => setSameBilling(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            L&apos;adresse de facturation est identique
          </label>

          {!sameBilling && (
            <div className="mt-8">
              <legend className="font-display text-2xl">
                Adresse de facturation
              </legend>
              <AddressFields
                value={billing}
                onChange={setBilling}
                prefix="billing"
              />
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl">
            Instructions (facultatif)
          </legend>
          <textarea
            rows={3}
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Code d'accès, étage, créneau de livraison…"
            className="mt-5 w-full border border-line bg-transparent p-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </fieldset>
      </div>

      {/* Récapitulatif et validation */}
      <aside className="lg:sticky lg:top-[104px] lg:self-start">
        <div className="border border-line p-7">
          <h2 className="eyebrow">Votre commande</h2>

          <ul className="mt-6 space-y-4 border-b border-line pb-6">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-[13px]">
                <span className="text-foreground-muted">
                  {item.productName}
                  <span className="block text-[11px]">
                    {item.variantLabel} × {item.quantity}
                  </span>
                </span>
                <span className="shrink-0">
                  {formatPrice(item.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Sous-total" value={formatPrice(cart.totals.subtotalCents)} />
            {cart.totals.discountCents > 0 && (
              <Row
                label="Remise"
                value={`− ${formatPrice(cart.totals.discountCents)}`}
              />
            )}
            <Row
              label="Livraison"
              value={
                cart.totals.shippingCents === 0
                  ? "Offerte"
                  : formatPrice(cart.totals.shippingCents)
              }
            />
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-6">
            <span className="text-[11px] uppercase tracking-[0.16em]">
              Total TTC
            </span>
            <span className="font-display text-3xl">
              {formatPrice(cart.totals.totalCents)}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-foreground-muted">
            dont {formatPrice(cart.totals.vatCents)} de TVA
          </p>

          <div className="mt-7 space-y-4">
            <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
              <input
                type="checkbox"
                checked={acceptsTerms}
                onChange={(e) => setAcceptsTerms(e.target.checked)}
                className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
              />
              <span>
                J&apos;ai lu et j&apos;accepte les{" "}
                <Link href="/cgv" target="_blank" className="underline hover:text-accent">
                  conditions générales de vente
                </Link>{" "}
                et la{" "}
                <Link
                  href="/confidentialite"
                  target="_blank"
                  className="underline hover:text-accent"
                >
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>

            {hasMadeToOrder && (
              <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
                <input
                  type="checkbox"
                  checked={waiver}
                  onChange={(e) => setWaiver(e.target.checked)}
                  className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  Ma commande comporte une pièce réalisée selon mes
                  spécifications. Je demande expressément qu&apos;elle soit
                  lancée en production et je reconnais perdre, pour cette
                  pièce, mon droit de rétractation (art. L221-28, 3° du code de
                  la consommation).
                </span>
              </label>
            )}
          </div>

          {error && (
            <p className="mt-5 text-[12px] text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || cart.items.length === 0}
            className="mt-7 flex h-13 w-full items-center justify-center gap-2 bg-foreground py-4 text-[11px] uppercase tracking-[0.18em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Redirection…
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Payer {formatPrice(cart.totals.totalCents)}
              </>
            )}
          </button>

          <p className="mt-5 text-[11px] leading-relaxed text-foreground-muted">
            Le paiement s&apos;effectue sur la page sécurisée de notre
            prestataire. Aucune donnée de carte bancaire n&apos;est saisie ni
            conservée sur ce site. Cartes bancaires, PayPal, Apple Pay et
            Google Pay acceptés.
          </p>
        </div>
      </aside>
    </form>
  );
}

function AddressFields({
  value,
  onChange,
  prefix,
}: {
  value: AddressState;
  onChange: (value: AddressState) => void;
  prefix: string;
}) {
  const set = (key: keyof AddressState) => (v: string) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <Field label="Prénom" required value={value.firstName} onChange={set("firstName")} autoComplete={`${prefix} given-name`} />
      <Field label="Nom" required value={value.lastName} onChange={set("lastName")} autoComplete={`${prefix} family-name`} />
      <div className="sm:col-span-2">
        <Field label="Société (facultatif)" value={value.company} onChange={set("company")} autoComplete="organization" />
      </div>
      <div className="sm:col-span-2">
        <Field label="Adresse" required value={value.line1} onChange={set("line1")} autoComplete={`${prefix} address-line1`} />
      </div>
      <div className="sm:col-span-2">
        <Field label="Complément (facultatif)" value={value.line2} onChange={set("line2")} autoComplete={`${prefix} address-line2`} />
      </div>
      <Field label="Code postal" required value={value.postalCode} onChange={set("postalCode")} autoComplete={`${prefix} postal-code`} />
      <Field label="Ville" required value={value.city} onChange={set("city")} autoComplete={`${prefix} address-level2`} />
      <label className="block">
        <span className="eyebrow">
          Pays<span className="text-accent"> *</span>
        </span>
        <select
          value={value.country}
          onChange={(e) => set("country")(e.target.value)}
          className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <Field label="Téléphone" value={value.phone} onChange={set("phone")} type="tel" autoComplete="tel" />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-foreground-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
