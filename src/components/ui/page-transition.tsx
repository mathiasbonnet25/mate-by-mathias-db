"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Transition d'une page à l'autre.
 *
 * Volontairement écrite en CSS et non avec Framer Motion. Une transition
 * animée en JavaScript ne démarre qu'une fois la page hydratée : le
 * contenu resterait invisible pendant tout ce temps, et le navigateur
 * retarderait d'autant sa mesure de vitesse d'affichage. En CSS,
 * l'animation part dès la première peinture, avant même que le
 * JavaScript ne soit exécuté.
 *
 * La clé de position garantit que React remonte l'enveloppe à chaque
 * navigation : l'animation se rejoue, sans quoi elle ne se verrait qu'au
 * premier chargement.
 *
 * Le mouvement se limite à un fondu, sans déplacement : un glissement
 * vertical décalerait le contenu au moment précis où le lecteur commence
 * à lire, et pèserait sur la mesure de stabilité visuelle.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
