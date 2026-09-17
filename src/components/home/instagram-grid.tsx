"use client";

import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

import { useConsent } from "@/components/legal/cookie-consent";
import { revealItem } from "@/components/ui/reveal";

export type InstagramItem = {
  id: string;
  imageUrl: string;
  permalink: string;
  caption: string | null;
};

/**
 * Galerie Instagram.
 *
 * Les images hébergées par Instagram déposent des traceurs côté Meta : elles
 * ne sont donc chargées qu'après acceptation de la catégorie « contenus
 * externes ». Sans consentement, un substitut explicite est affiché avec un
 * lien direct vers le compte.
 */
export function InstagramGrid({
  items,
  handle,
}: {
  items: InstagramItem[];
  handle: string;
}) {
  const { choices, openPreferences } = useConsent();

  if (items.length === 0) return null;

  if (!choices.media) {
    return (
      <div className="rounded-lg border border-line bg-surface-muted p-12 text-center">
        <Instagram className="mx-auto h-6 w-6 text-accent" aria-hidden />
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-foreground-muted">
          La galerie Instagram est un contenu externe qui dépose ses propres
          traceurs. Elle ne s&apos;affiche qu&apos;avec votre accord.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openPreferences}
            className="rounded-full h-11 bg-accent px-7 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-all hover:brightness-110"
          >
            Autoriser les contenus externes
          </button>
          <a
            href={`https://instagram.com/${handle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 rounded-full border border-line px-7 text-[11px] uppercase leading-[2.75rem] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Voir sur Instagram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <motion.a
          key={item.id}
          variants={revealItem}
          href={item.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden bg-surface-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.caption ?? "Publication Instagram de l'atelier"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
          />
          <span
            className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-all duration-500 group-hover:bg-black/45 group-hover:opacity-100"
            aria-hidden
          >
            <Instagram className="h-5 w-5" />
          </span>
        </motion.a>
      ))}
    </div>
  );
}
