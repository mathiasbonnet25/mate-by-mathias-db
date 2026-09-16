"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";

import { signUpAction } from "@/app/actions/auth";

/**
 * Création de compte.
 *
 * L'indicateur de robustesse reproduit côté navigateur les règles appliquées
 * par le serveur, à titre indicatif : la validation qui fait foi reste celle
 * de `assessPassword`, exécutée côté serveur.
 */
const RULES = [
  { label: "12 caractères minimum", test: (p: string) => p.length >= 12 },
  { label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
  { label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
  { label: "Un caractère spécial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function SignUpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    acceptsTerms: false,
    acceptsMarketing: false,
  });

  const checks = useMemo(
    () => RULES.map((rule) => ({ ...rule, ok: rule.test(form.password) })),
    [form.password],
  );

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUpAction(form);
      if (!result.ok) {
        setError(result.error ?? "La création du compte a échoué.");
        return;
      }
      router.push("/compte");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
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
      </div>

      <Field
        label="Adresse électronique"
        type="email"
        required
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        autoComplete="email"
      />

      <Field
        label="Mot de passe"
        type="password"
        required
        value={form.password}
        onChange={(v) => setForm((f) => ({ ...f, password: v }))}
        autoComplete="new-password"
      />

      {form.password.length > 0 && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {checks.map((check) => (
            <li
              key={check.label}
              className={`flex items-center gap-2 text-[11px] ${
                check.ok ? "text-accent" : "text-foreground-muted"
              }`}
            >
              {check.ok ? (
                <Check className="h-3 w-3" aria-hidden />
              ) : (
                <X className="h-3 w-3" aria-hidden />
              )}
              {check.label}
            </li>
          ))}
        </ul>
      )}

      <Field
        label="Confirmer le mot de passe"
        type="password"
        required
        value={form.passwordConfirm}
        onChange={(v) => setForm((f) => ({ ...f, passwordConfirm: v }))}
        autoComplete="new-password"
      />

      <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
        <input
          type="checkbox"
          checked={form.acceptsTerms}
          onChange={(e) =>
            setForm((f) => ({ ...f, acceptsTerms: e.target.checked }))
          }
          className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          J&apos;accepte les{" "}
          <Link href="/cgv" className="underline hover:text-accent">
            conditions générales de vente
          </Link>{" "}
          et j&apos;ai pris connaissance de la{" "}
          <Link href="/confidentialite" className="underline hover:text-accent">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
        <input
          type="checkbox"
          checked={form.acceptsMarketing}
          onChange={(e) =>
            setForm((f) => ({ ...f, acceptsMarketing: e.target.checked }))
          }
          className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          Je souhaite recevoir les actualités de l&apos;atelier. Facultatif, et
          révocable à tout moment.
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
        className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-[11px] uppercase tracking-[0.18em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Créer mon compte
      </button>

      <p className="text-center text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
        Déjà client ?{" "}
        <Link href="/connexion" className="hover:text-accent">
          Se connecter
        </Link>
      </p>
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
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}
