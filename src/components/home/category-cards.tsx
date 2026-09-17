"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";

import { revealItem } from "@/components/ui/reveal";

export type CategoryCard = {
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
};

/**
 * Entrées vers les univers du site.
 *
 * Trois partis pris :
 *
 *  - **Formes alternées.** Une arche, puis deux galets aux rayons inversés.
 *    Quatre rectangles identiques donnaient une grille de tableur ;
 *    l'alternance donne un rythme.
 *  - **Composition asymétrique.** Les cartes n'ont ni la même hauteur ni le
 *    même alignement vertical. Le décalage se fait à partir du format
 *    tablette, où il y a la place ; en dessous, tout s'empile.
 *  - **Parallaxe légère.** L'image se déplace plus lentement que la carte au
 *    défilement. C'est de la transformation pure, donc calculée par la carte
 *    graphique et sans coût de mise en page.
 */

/**
 * Forme et décalage vertical propres à chaque position dans la grille.
 *
 * Seules des formes à pied plat sont employées : ces cartes portent leur
 * titre et leur bouton en bas, une courbe basse les rognerait.
 */
const RYTHME = [
  { forme: "arch", decalage: "md:mt-0", hauteur: "h-[440px] lg:h-[540px]" },
  { forme: "pebble-soft", decalage: "md:mt-20", hauteur: "h-[440px] lg:h-[500px]" },
  { forme: "pebble-soft-mirror", decalage: "md:-mt-10", hauteur: "h-[440px] lg:h-[500px]" },
  { forme: "arch", decalage: "md:mt-10", hauteur: "h-[440px] lg:h-[540px]" },
] as const;

export function CategoryCards({ cards }: { cards: CategoryCard[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
      {cards.map((card, index) => (
        <CarteCategorie
          key={card.href}
          card={card}
          rythme={RYTHME[index % RYTHME.length]!}
        />
      ))}
    </div>
  );
}

function CarteCategorie({
  card,
  rythme,
}: {
  card: CategoryCard;
  rythme: (typeof RYTHME)[number];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // L'image traverse le cadre un peu plus lentement que le défilement.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-8%", "8%"],
  );

  return (
    <motion.div ref={ref} variants={revealItem} className={rythme.decalage}>
      <Link
        href={card.href}
        className={`group relative block ${rythme.hauteur} ${rythme.forme} shadow-[var(--shadow-soft)] transition-shadow duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[var(--shadow-lifted)]`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div style={{ y }} className="absolute inset-[-10%]">
            {card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
              />
            ) : (
              <div
                className="h-full w-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
                style={{
                  background:
                    "radial-gradient(120% 90% at 30% 20%, #26241f 0%, #14130f 55%, #0b0a08 100%)",
                }}
                aria-hidden
              />
            )}
          </motion.div>

          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-700 group-hover:from-black/95"
            aria-hidden
          />
        </div>

        <div className="relative flex h-full flex-col justify-end p-8 pt-20 text-white lg:p-11 lg:pt-28">
          {/* Le filet doré s'allonge au survol : un seul mouvement, lent. */}
          <span className="block h-px w-12 rounded-full bg-gold-300 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:w-28" />

          <h3 className="mt-6 font-display text-3xl leading-tight lg:text-[2.6rem]">
            {card.title}
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            {card.description}
          </p>

          <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-gold-200 transition-all duration-500 group-hover:border-gold-300 group-hover:bg-gold-300 group-hover:text-ink-950">
            Découvrir
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
