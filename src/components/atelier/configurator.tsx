"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Info, Loader2 } from "lucide-react";

import {
  estimate,
  type OptionView,
  type Selection,
  type StepKey,
} from "@/lib/customization-shared";
import { formatPrice } from "@/lib/utils";
import { submitQuoteAction } from "@/app/actions/quote";

const STEPS: { key: StepKey; title: string; hint: string }[] = [
  { key: "SUPPORT", title: "La pièce", hint: "Que souhaitez-vous faire peindre ?" },
  { key: "PAINT", title: "La peinture", hint: "Quel type de peinture imaginez-vous ?" },
  { key: "FINISH", title: "La finition", hint: "Mat, satiné ou brillant ?" },
  { key: "EXTRA", title: "Les options", hint: "Ajoutez ce qui rendra la pièce unique." },
];

/**
 * Atelier de personnalisation : quatre étapes, une estimation qui se met à
 * jour à chaque choix, puis l'envoi de la demande.
 *
 * L'estimation affichée est informative. Le montant définitivement
 * enregistré est recalculé côté serveur à partir du même barème.
 */
export function Configurator({
  options,
}: {
  options: Record<StepKey, OptionView[]>;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState<Selection>({
    support: null,
    paint: null,
    finish: null,
    extras: [],
  });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    consent: false,
  });
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => estimate(options, selection), [options, selection]);
  const step = STEPS[stepIndex]!;
  const isRecap = stepIndex === STEPS.length;

  const stepComplete =
    step.key === "SUPPORT"
      ? Boolean(selection.support)
      : step.key === "PAINT"
        ? Boolean(selection.paint)
        : step.key === "FINISH"
          ? Boolean(selection.finish)
          : true;

  function choose(stepKey: StepKey, slug: string) {
    setSelection((prev) => {
      if (stepKey === "SUPPORT") return { ...prev, support: slug };
      if (stepKey === "PAINT") return { ...prev, paint: slug };
      if (stepKey === "FINISH") return { ...prev, finish: slug };
      return {
        ...prev,
        extras: prev.extras.includes(slug)
          ? prev.extras.filter((s) => s !== slug)
          : [...prev.extras, slug],
      };
    });
  }

  function isChosen(stepKey: StepKey, slug: string) {
    if (stepKey === "SUPPORT") return selection.support === slug;
    if (stepKey === "PAINT") return selection.paint === slug;
    if (stepKey === "FINISH") return selection.finish === slug;
    return selection.extras.includes(slug);
  }

  function labelFor(stepKey: StepKey, slug: string | null) {
    if (!slug) return "—";
    return options[stepKey].find((o) => o.slug === slug)?.label ?? "—";
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.consent) {
      setError(
        "Merci d'accepter le traitement de vos données pour pouvoir vous répondre.",
      );
      return;
    }

    startTransition(async () => {
      const result = await submitQuoteAction({
        selection,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        message: form.message,
        consent: form.consent,
      });

      if (!result.ok) {
        setError(result.error ?? "L'envoi a échoué. Merci de réessayer.");
        return;
      }
      setSubmitted(result.number ?? null);
    });
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl rounded-lg border border-line p-12 text-center"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-accent text-accent">
          <Check className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-8 font-display text-3xl">Demande envoyée</h2>
        <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
          Votre demande porte la référence{" "}
          <strong className="text-foreground">{submitted}</strong>. Je l&apos;étudie
          et je reviens vers vous sous 3 jours ouvrés avec un devis personnalisé.
        </p>
        <p className="mt-6 text-[12px] leading-relaxed text-foreground-muted">
          Un accusé de réception vous a été envoyé par courriel. Vos données
          sont conservées le temps du traitement de votre demande puis, en
          l&apos;absence de commande, pendant trois ans à compter de notre
          dernier échange.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
      <div>
        {/* Progression */}
        <ol className="mb-12 flex flex-wrap items-center gap-x-3 gap-y-3">
          {STEPS.map((s, i) => {
            const done = i < stepIndex || isRecap;
            const current = i === stepIndex;
            return (
              <li key={s.key} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStepIndex(i)}
                  className="flex items-center gap-2.5 text-left"
                  aria-current={current ? "step" : undefined}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[11px] transition-colors ${
                      done
                        ? "border-accent bg-accent text-accent-contrast"
                        : current
                          ? "border-accent text-accent"
                          : "border-line text-foreground-muted"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-[11px] uppercase tracking-[0.16em] sm:inline ${
                      current ? "text-foreground" : "text-foreground-muted"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="h-px w-6 bg-[var(--border)]" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          {!isRecap ? (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">Étape {stepIndex + 1} sur {STEPS.length}</p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl">
                {step.hint}
              </h2>
              {step.key === "EXTRA" && (
                <p className="mt-3 text-sm text-foreground-muted">
                  Plusieurs options peuvent être combinées. Cette étape est
                  facultative.
                </p>
              )}

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {options[step.key].map((option) => {
                  const chosen = isChosen(step.key, option.slug);
                  return (
                    <button
                      key={option.slug}
                      type="button"
                      onClick={() => choose(step.key, option.slug)}
                      aria-pressed={chosen}
                      className={`group relative border p-6 text-left transition-all duration-400 ${
                        chosen
                          ? "border-accent bg-accent/[0.06]"
                          : "border-line hover:border-accent/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display text-xl">{option.label}</h3>
                        <span
                          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
                            chosen
                              ? "border-accent bg-accent text-accent-contrast"
                              : "border-line"
                          } ${option.isMultiple ? "" : "rounded-full"}`}
                          aria-hidden
                        >
                          {chosen && <Check className="h-3 w-3" />}
                        </span>
                      </div>
                      {option.description && (
                        <p className="mt-2.5 text-[13px] leading-relaxed text-foreground-muted">
                          {option.description}
                        </p>
                      )}
                      <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-accent">
                        {option.priceCents > 0
                          ? `à partir de ${formatPrice(option.priceCents)}`
                          : option.priceMultiplier !== 1000
                            ? `× ${(option.priceMultiplier / 1000).toFixed(2).replace(".", ",")}`
                            : "inclus"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="recap"
              onSubmit={onSubmit}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              noValidate
            >
              <p className="eyebrow">Dernière étape</p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl">
                Vos coordonnées
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">
                Elles me permettent d&apos;étudier votre projet et de vous
                adresser un devis.
              </p>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Prénom"
                  required
                  value={form.firstName}
                  onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  autoComplete="given-name"
                />
                <Field
                  label="Nom"
                  required
                  value={form.lastName}
                  onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  autoComplete="family-name"
                />
                <Field
                  label="Adresse électronique"
                  type="email"
                  required
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  autoComplete="email"
                />
                <Field
                  label="Téléphone (facultatif)"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  autoComplete="tel"
                />
              </div>

              <label className="mt-6 block">
                <span className="eyebrow">Votre projet</span>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  maxLength={3000}
                  placeholder="Marque et modèle du cadre, teintes souhaitées, références visuelles, délai idéal…"
                  className="mt-3 w-full rounded-sm border border-line bg-transparent p-4 text-sm outline-none transition-colors focus:border-accent"
                />
              </label>

              <label className="mt-6 flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, consent: e.target.checked }))
                  }
                  className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  J&apos;accepte que mes données soient utilisées pour traiter
                  ma demande de devis. Elles ne sont ni revendues ni cédées.
                  Je peux demander leur accès, leur rectification ou leur
                  effacement à tout moment — voir la{" "}
                  <a href="/confidentialite" className="underline hover:text-accent">
                    politique de confidentialité
                  </a>
                  .
                </span>
              </label>

              {error && (
                <p className="mt-4 text-[12px] text-red-500" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-8 inline-flex h-13 items-center gap-2 bg-accent px-10 py-4 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-all hover:brightness-110 disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Envoyer ma demande
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-line pt-8">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-accent disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </button>

          {!isRecap && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i + 1)}
              disabled={!stepComplete}
              className="inline-flex items-center gap-2 bg-foreground px-8 py-3.5 text-[11px] uppercase tracking-[0.16em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-30"
            >
              {stepIndex === STEPS.length - 1 ? "Récapitulatif" : "Continuer"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Estimateur */}
      <aside className="lg:sticky lg:top-[104px] lg:self-start">
        <div className="card-soft p-7">
          <h2 className="eyebrow">Estimation</h2>

          <motion.p
            key={total}
            initial={{ opacity: 0.4, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 font-display text-4xl"
          >
            {total > 0 ? formatPrice(total) : "—"}
          </motion.p>

          <dl className="mt-8 space-y-3 border-t border-line pt-6 text-[13px]">
            <Row label="Pièce" value={labelFor("SUPPORT", selection.support)} />
            <Row label="Peinture" value={labelFor("PAINT", selection.paint)} />
            <Row label="Finition" value={labelFor("FINISH", selection.finish)} />
            <div className="flex items-start justify-between gap-4">
              <dt className="text-foreground-muted">Options</dt>
              <dd className="text-right">
                {selection.extras.length === 0
                  ? "—"
                  : selection.extras
                      .map((slug) => labelFor("EXTRA", slug))
                      .join(", ")}
              </dd>
            </div>
          </dl>

          {/* Mention obligatoire : ce montant n'engage pas l'atelier. */}
          <div className="mt-8 flex gap-3 border border-accent/40 bg-accent/[0.06] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <p className="text-[12px] leading-relaxed">
              Ce montant est une estimation. Un devis personnalisé sera établi
              après étude de votre projet.
            </p>
          </div>

          {!isRecap && (
            <button
              type="button"
              onClick={() => setStepIndex(STEPS.length)}
              disabled={!selection.support}
              className="mt-6 h-12 w-full rounded-full border border-line text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
            >
              Demander un devis
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
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
        maxLength={160}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}
