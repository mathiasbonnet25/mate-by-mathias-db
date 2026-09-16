"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { submitContactAction } from "@/app/actions/contact";

const SUBJECTS = [
  { value: "general", label: "Question générale" },
  { value: "sav", label: "Service après-vente" },
  { value: "complaint", label: "Réclamation" },
  { value: "data", label: "Mes données personnelles" },
] as const;

const DATA_RIGHTS = [
  { value: "ACCESS", label: "Accès à mes données" },
  { value: "RECTIFICATION", label: "Rectification" },
  { value: "ERASURE", label: "Effacement" },
  { value: "PORTABILITY", label: "Portabilité" },
  { value: "OBJECTION", label: "Opposition" },
  { value: "RESTRICTION", label: "Limitation" },
] as const;

/**
 * Formulaire de contact. Il oriente aussi les demandes d'exercice des droits
 * RGPD vers un suivi dédié, avec échéance légale.
 */
export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    kind: "general" as (typeof SUBJECTS)[number]["value"],
    dataRight: "ACCESS" as (typeof DATA_RIGHTS)[number]["value"],
    consent: false,
    website: "",
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitContactAction({
        ...form,
        dataRight: form.kind === "data" ? form.dataRight : undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "L'envoi a échoué.");
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="border border-line p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-accent text-accent">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-7 font-display text-2xl">Message envoyé</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          {form.kind === "data"
            ? "Votre demande relative à vos données est enregistrée. Nous y répondons dans un délai d'un mois à compter de sa réception, conformément au RGPD."
            : "Merci. Je vous réponds sous deux jours ouvrés."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* Champ leurre, invisible pour les personnes, rempli par les robots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Ne pas remplir</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Nom"
          required
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          autoComplete="name"
        />
        <Field
          label="Adresse électronique"
          type="email"
          required
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          autoComplete="email"
        />
      </div>

      <label className="block">
        <span className="eyebrow">Nature de la demande</span>
        <select
          value={form.kind}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              kind: e.target.value as typeof f.kind,
            }))
          }
          className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
        >
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {form.kind === "data" && (
        <label className="block">
          <span className="eyebrow">Droit exercé</span>
          <select
            value={form.dataRight}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dataRight: e.target.value as typeof f.dataRight,
              }))
            }
            className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
          >
            {DATA_RIGHTS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground-muted">
            Un justificatif d&apos;identité pourra être demandé en cas de doute
            raisonnable sur votre identité. Il sera détruit dès la vérification
            effectuée.
          </p>
        </label>
      )}

      <Field
        label="Objet"
        required
        value={form.subject}
        onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
      />

      <label className="block">
        <span className="eyebrow">
          Message<span className="text-accent"> *</span>
        </span>
        <textarea
          rows={7}
          required
          maxLength={5000}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="mt-3 w-full border border-line bg-transparent p-4 text-sm outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          J&apos;accepte que mes données soient utilisées pour traiter ma
          demande. Elles sont conservées trois ans à compter de notre dernier
          échange — voir la{" "}
          <a href="/confidentialite" className="underline hover:text-accent">
            politique de confidentialité
          </a>
          .
        </span>
      </label>

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center gap-2 bg-foreground px-10 text-[11px] uppercase tracking-[0.18em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Envoyer
      </button>
    </form>
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
        maxLength={180}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}
