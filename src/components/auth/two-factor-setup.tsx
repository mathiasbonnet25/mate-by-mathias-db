"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Copy, Loader2, ShieldCheck } from "lucide-react";

import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  startTwoFactorSetup,
} from "@/app/actions/account";

/**
 * Activation et désactivation de la double authentification.
 *
 * Les codes de secours ne sont affichés qu'une seule fois : seuls leurs
 * condensats sont conservés, ils ne peuvent donc pas être réaffichés
 * ultérieurement.
 */
export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [copied, setCopied] = useState(false);

  function begin() {
    setError(null);
    startTransition(async () => {
      const result = await startTwoFactorSetup();
      if (!result.ok) {
        setError(result.error ?? "Configuration impossible.");
        return;
      }
      setQr(result.qrCodeDataUrl ?? null);
      setSecret(result.secret ?? null);
    });
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmTwoFactorSetup(token);
      if (!result.ok) {
        setError(result.error ?? "Code invalide.");
        return;
      }
      setRecoveryCodes(result.recoveryCodes ?? []);
      setIsEnabled(true);
      setQr(null);
      setSecret(null);
      setToken("");
    });
  }

  function disable(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await disableTwoFactor({ password });
      if (!result.ok) {
        setError(result.error ?? "Désactivation impossible.");
        return;
      }
      setIsEnabled(false);
      setPassword("");
    });
  }

  if (recoveryCodes) {
    return (
      <div className="border border-accent/50 p-7">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-accent">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Double authentification activée
        </p>

        <div className="mt-6 flex gap-3 rounded-lg border border-line p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <p className="text-[12px] leading-relaxed">
            Conservez ces codes de secours en lieu sûr. Ils permettent
            d&apos;accéder à votre compte si vous perdez votre téléphone. Chaque
            code ne fonctionne qu&apos;une fois et{" "}
            <strong>ils ne pourront plus être affichés</strong>.
          </p>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <li key={code} className="rounded-lg border border-line p-3 text-center">
              {code}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(recoveryCodes.join("\n"));
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copiés" : "Copier les codes"}
        </button>

        <button
          type="button"
          onClick={() => setRecoveryCodes(null)}
          className="ml-3 mt-5 text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
        >
          J&apos;ai noté mes codes
        </button>
      </div>
    );
  }

  if (isEnabled) {
    return (
      <div className="card-soft p-7">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-accent">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Activée
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
          Un code à usage unique vous est demandé à chaque connexion. C&apos;est
          la protection la plus efficace contre la réutilisation d&apos;un mot
          de passe compromis.
        </p>

        <form onSubmit={disable} className="mt-7 max-w-sm">
          <label className="block">
            <span className="eyebrow">
              Désactiver — confirmez votre mot de passe
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
            />
          </label>

          {error && (
            <p className="mt-3 text-[12px] text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !password}
            className="mt-4 inline-flex items-center gap-2 rounded-full rounded-full border border-line px-8 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-40"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Désactiver la double authentification
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card-soft p-7">
      <p className="text-sm leading-relaxed text-foreground-muted">
        La double authentification ajoute un code à usage unique, généré par
        une application sur votre téléphone. Même en cas de vol de votre mot de
        passe, votre compte reste protégé.
      </p>

      {!qr ? (
        <>
          {error && (
            <p className="mt-4 text-[12px] text-red-500" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={begin}
            disabled={pending}
            className="mt-6 inline-flex items-center gap-2 bg-foreground px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Activer
          </button>
        </>
      ) : (
        <form onSubmit={confirm} className="mt-7">
          <p className="eyebrow">1. Scannez ce code</p>
          <div className="mt-4 inline-block rounded-lg border border-line bg-white p-3">
            <Image
              src={qr}
              alt="QR code de configuration de la double authentification"
              width={200}
              height={200}
              unoptimized
            />
          </div>

          {secret && (
            <p className="mt-4 text-[12px] text-foreground-muted">
              Vous ne pouvez pas scanner ? Saisissez cette clé manuellement :{" "}
              <code className="font-mono text-foreground">{secret}</code>
            </p>
          )}

          <label className="mt-8 block max-w-xs">
            <span className="eyebrow">2. Saisissez le code affiché</span>
            <input
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-center text-lg tracking-[0.5em] outline-none transition-colors focus:border-accent"
            />
          </label>

          {error && (
            <p className="mt-3 text-[12px] text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || token.length !== 6}
            className="mt-5 inline-flex items-center gap-2 bg-accent px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-accent-contrast transition-all hover:brightness-110 disabled:opacity-40"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Confirmer
          </button>
        </form>
      )}
    </div>
  );
}
