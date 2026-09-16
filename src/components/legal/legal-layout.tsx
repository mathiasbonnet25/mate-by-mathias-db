import type { ReactNode } from "react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";

/**
 * Gabarit des pages juridiques : une colonne de lecture étroite, une
 * hiérarchie claire et la date de dernière mise à jour, qui doit être
 * actualisée à chaque modification de fond.
 */
export function LegalLayout({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page pb-32 pt-[132px] md:pt-[168px]">
      <Reveal>
        <nav aria-label="Fil d'Ariane" className="mb-8">
          <ol className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
            <li>
              <Link href="/" className="hover:text-accent">
                Accueil
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>

        <h1 className="max-w-3xl text-balance font-display text-5xl leading-[1.05] md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-foreground-muted">
          Dernière mise à jour : {updatedAt}
        </p>
        {intro && (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground-muted">
            {intro}
          </p>
        )}
        <div className="rule-gold mt-12" />
      </Reveal>

      <article className="legal-prose mt-16 max-w-3xl">{children}</article>

      <Reveal>
        <div className="mt-20 max-w-3xl border border-line p-7 text-[12px] leading-relaxed text-foreground-muted">
          <p>
            <strong className="text-foreground">Avertissement.</strong> Ce texte
            constitue une base de travail. Il doit être relu, complété et
            adapté à la situation réelle de l&apos;entreprise — statut, numéro
            d&apos;immatriculation, régime de TVA, assurances, prestataires
            effectivement utilisés — puis validé par un professionnel du droit
            avant la mise en ligne.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/** Section de texte juridique avec ancre, pour pouvoir y renvoyer. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-14 scroll-mt-28 first:mt-0">
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-[1.85] text-foreground-muted">
        {children}
      </div>
    </section>
  );
}
