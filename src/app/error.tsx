"use client";

import { useEffect } from "react";

/**
 * Page d'erreur. Le détail technique n'est jamais affiché au visiteur :
 * il pourrait révéler la structure interne de l'application.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erreur]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-40">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl">Une erreur est survenue</h1>
        <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
          Nous n&apos;avons pas pu afficher cette page. Réessayez dans un
          instant. Si le problème persiste, écrivez-nous et nous regarderons
          ce qui s&apos;est passé.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-foreground-muted">
            Référence : {error.digest}
          </p>
        )}
        <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="h-12 bg-foreground px-8 text-[11px] uppercase tracking-[0.18em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Réessayer
          </button>
          <a
            href="/contact"
            className="h-12 border border-line px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
}
