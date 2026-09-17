"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";

import { signInAction } from "@/app/actions/auth";

/**
 * Connexion en deux temps : identifiants, puis second facteur si le compte
 * en exige un. Les messages d'erreur ne permettent jamais de déterminer si
 * une adresse existe dans la base.
 */
export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    totp: "",
    recoveryCode: "",
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signInAction({
        email: form.email,
        password: form.password,
        totp: useRecovery ? undefined : form.totp || undefined,
        recoveryCode: useRecovery ? form.recoveryCode || undefined : undefined,
      });

      if (result.ok) {
        const next = params.get("suite") ?? "/compte";
        router.push(next.startsWith("/") ? next : "/compte");
        router.refresh();
        return;
      }

      if (result.needsTwoFactor) setNeedsTwoFactor(true);
      setError(result.error ?? "Connexion impossible.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <label className="block">
        <span className="eyebrow">Adresse électronique</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="eyebrow">Mot de passe</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
        />
      </label>

      {needsTwoFactor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border border-accent/40 bg-accent/[0.05] p-5"
        >
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-accent">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Double authentification
          </p>

          {!useRecovery ? (
            <label className="mt-4 block">
              <span className="text-[13px] text-foreground-muted">
                Saisissez le code à six chiffres affiché par votre application
                d&apos;authentification.
              </span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={form.totp}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    totp: e.target.value.replace(/\D/g, ""),
                  }))
                }
                className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-center text-lg tracking-[0.5em] outline-none transition-colors focus:border-accent"
              />
            </label>
          ) : (
            <label className="mt-4 block">
              <span className="text-[13px] text-foreground-muted">
                Saisissez l&apos;un de vos codes de secours. Chaque code ne peut
                servir qu&apos;une fois.
              </span>
              <input
                autoComplete="off"
                maxLength={12}
                value={form.recoveryCode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recoveryCode: e.target.value.toUpperCase(),
                  }))
                }
                className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-center text-sm uppercase tracking-[0.2em] outline-none transition-colors focus:border-accent"
              />
            </label>
          )}

          <button
            type="button"
            onClick={() => setUseRecovery((v) => !v)}
            className="mt-4 text-[11px] uppercase tracking-[0.14em] text-accent underline underline-offset-4"
          >
            {useRecovery
              ? "Utiliser l'application d'authentification"
              : "Utiliser un code de secours"}
          </button>
        </motion.div>
      )}

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full flex h-12 w-full items-center justify-center gap-2 bg-foreground text-[11px] uppercase tracking-[0.18em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Se connecter
      </button>

      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
        <Link href="/mot-de-passe-oublie" className="hover:text-accent">
          Mot de passe oublié
        </Link>
        <Link href="/inscription" className="hover:text-accent">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
