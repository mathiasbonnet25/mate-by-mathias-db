"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { revealItem } from "@/components/ui/reveal";

export type CategoryCard = {
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
};

/**
 * Grandes cartes d'entrée vers les univers du site. Au survol, l'image se
 * rapproche lentement et le filet doré se déploie : le mouvement reste
 * discret, jamais brusque.
 */
export function CategoryCards({ cards }: { cards: CategoryCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map((card) => (
        <motion.div key={card.href} variants={revealItem}>
          <Link
            href={card.href}
            className="group relative block h-[380px] overflow-hidden border border-line lg:h-[460px]"
          >
            <div className="absolute inset-0 overflow-hidden">
              {card.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              ) : (
                <div
                  className="h-full w-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(145deg, #1f1f1d 0%, #0f0f0e 60%, #16130c 100%)",
                  }}
                  aria-hidden
                />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-700 group-hover:from-black/90"
                aria-hidden
              />
            </div>

            <div className="relative flex h-full flex-col justify-end p-8 text-white lg:p-10">
              <span className="block h-px w-12 bg-gold-300 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-24" />
              <h3 className="mt-6 font-display text-3xl lg:text-4xl">
                {card.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
                {card.description}
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-300">
                Découvrir
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                  aria-hidden
                />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
