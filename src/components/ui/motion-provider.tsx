"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Réglage global des animations.
 *
 * `reducedMotion="user"` fait respecter la préférence système « réduire
 * les animations » à tous les composants Framer Motion du site : les
 * déplacements et mises à l'échelle sont neutralisés, les fondus
 * conservés.
 *
 * Ce réglage est indispensable : Framer Motion anime en JavaScript, la
 * règle CSS `prefers-reduced-motion` de la feuille de style globale n'a
 * donc aucun effet sur lui. Elle ne couvre que les transitions et
 * animations écrites en CSS.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
