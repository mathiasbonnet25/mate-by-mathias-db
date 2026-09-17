import Link from "next/link";

import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Page introuvable",
  description: "Cette page n'existe pas ou a été déplacée.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-40">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl text-accent/30">404</p>
        <h1 className="mt-6 font-display text-4xl">Page introuvable</h1>
        <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
          Cette adresse ne correspond à aucune page. Le produit a peut-être été
          retiré de la boutique, ou le lien comporte une erreur.
        </p>
        <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="h-12 bg-foreground px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/velos"
            className="h-12 rounded-full border border-line px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Voir la boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
