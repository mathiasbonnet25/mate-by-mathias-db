"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Apparitions au défilement.
 *
 * Les réglages précédents (28 px de décalage, déclenchement à −80 px)
 * étaient si discrets qu'on ne les voyait pas. Le mouvement est désormais
 * plus ample et se déclenche plus tôt, pour être perçu sans devenir
 * tapageur :
 *
 *  - déplacement vertical plus marqué ;
 *  - très léger agrandissement, qui donne l'impression que l'élément
 *    s'avance vers le lecteur ;
 *  - déclenchement dès que l'élément approche du bas de l'écran, afin que
 *    l'animation ait le temps de se jouer avant qu'il ne soit lu.
 *
 * Seules `opacity` et `transform` sont animées : ce sont les deux
 * propriétés que le navigateur confie à la carte graphique. Animer une
 * hauteur ou une marge forcerait un recalcul de mise en page à chaque
 * image.
 */

const SORTIE = [0.32, 0.72, 0, 1] as const;

type RevealProps = {
  children: ReactNode;
  delay?: number;
  /** Décalage initial, en pixels. */
  offset?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
};

export function Reveal({
  children,
  delay = 0,
  offset = 48,
  className,
  as = "div",
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = reduceMotion
    ? {
        // Préférence « réduire les animations » : on se contente d'un
        // fondu court, sans aucun déplacement.
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2, delay: 0 } },
      }
    : {
        hidden: { opacity: 0, y: offset, scale: 0.985 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.95, delay, ease: SORTIE },
        },
      };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/** Conteneur qui décale l'apparition de ses enfants directs. */
export function RevealGroup({
  children,
  className,
  stagger = 0.12,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : stagger,
            delayChildren: reduceMotion ? 0 : 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Variante d'un élément à l'intérieur d'un RevealGroup.
 *
 * Elle est déclarée hors composant et ne peut donc pas consulter
 * `useReducedMotion`. La préférence est prise en compte plus haut, par le
 * `MotionConfig` de la mise en page : la règle CSS globale ne suffirait
 * pas, puisque Framer Motion anime en JavaScript et non par transition
 * CSS.
 */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: SORTIE },
  },
};

/** Apparition latérale, pour les compositions asymétriques. */
export const revealFromSide = (cote: "gauche" | "droite"): Variants => ({
  hidden: { opacity: 0, x: cote === "gauche" ? -56 : 56 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.95, ease: SORTIE },
  },
});
