"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { revealItem } from "@/components/ui/reveal";
import { formatDate } from "@/lib/utils";

export type ReviewData = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  collectedAt: string;
  isVerifiedPurchase: boolean;
  productName?: string | null;
};

/**
 * Affichage des avis clients.
 *
 * L'article L111-7-2 du code de la consommation impose d'indiquer si les
 * avis font l'objet d'un contrôle et de préciser leur date de publication :
 * la date de collecte et la mention d'achat vérifié sont donc affichées.
 */
export function Reviews({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) return null;

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <motion.figure
            key={review.id}
            variants={revealItem}
            className="flex h-full flex-col border border-line p-8 transition-colors duration-500 hover:border-accent/50"
          >
            {/* Le rôle img fait de ce groupe d'étoiles une image porteuse
                de sens, ce qui rend son étiquette exploitable par les
                lecteurs d'écran. */}
            <div
              className="flex gap-1"
              role="img"
              aria-label={`Note : ${review.rating} sur 5`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < review.rating
                      ? "fill-accent text-accent"
                      : "text-foreground-muted/40"
                  }`}
                  aria-hidden
                />
              ))}
            </div>

            {review.title && (
              <h3 className="mt-5 font-display text-xl">{review.title}</h3>
            )}

            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground-muted">
              « {review.body} »
            </blockquote>

            <figcaption className="mt-6 border-t border-line pt-4">
              <p className="text-[13px]">{review.authorName}</p>
              <p className="mt-1 text-[11px] text-foreground-muted">
                Avis déposé le {formatDate(review.collectedAt)}
                {review.productName ? ` · ${review.productName}` : ""}
              </p>
              {review.isVerifiedPurchase && (
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-accent">
                  Achat vérifié
                </p>
              )}
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-foreground-muted">
        Les avis publiés sont ceux de clients ayant passé commande sur le site
        ou confié un projet à l&apos;atelier. Ils sont contrôlés avant
        publication : nous vérifions qu&apos;ils correspondent à une commande
        réelle et écartons les contenus injurieux ou hors sujet. Aucun avis
        n&apos;est supprimé au seul motif qu&apos;il serait négatif, et aucune
        contrepartie n&apos;est offerte en échange d&apos;un avis.
      </p>
    </>
  );
}
