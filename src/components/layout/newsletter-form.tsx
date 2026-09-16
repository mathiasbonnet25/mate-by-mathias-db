"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inscription à la newsletter en double opt-in : l'adresse n'est activée
 * qu'après confirmation par courriel. La case de consentement n'est jamais
 * pré-cochée.
 */
export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) {
      setState("error");
      setMessage("Merci de cocher la case de consentement.");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setState("done");
      setMessage(
        "Merci. Un courriel de confirmation vient de vous être envoyé.",
      );
      setEmail("");
      setConsent(false);
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Inscription impossible.",
      );
    }
  }

  if (state === "done") {
    return (
      <p className={cn("text-sm text-accent", className)} role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", className)} noValidate>
      <div className="flex items-center border-b border-line focus-within:border-accent">
        <label htmlFor="newsletter-email" className="sr-only">
          Adresse électronique
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-foreground-muted"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          aria-label="S'inscrire à la newsletter"
          className="grid h-11 w-11 shrink-0 place-items-center text-foreground-muted transition-colors hover:text-accent disabled:opacity-40"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-foreground-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          J&apos;accepte de recevoir les actualités de Mate by Mathias. Je peux
          me désinscrire à tout moment via le lien présent dans chaque message.
        </span>
      </label>

      {state === "error" && (
        <p className="text-[11px] text-red-500" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
