"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Signature typographique de la marque.
 *
 * Le monogramme est tracé en SVG : il reste net à toutes les tailles et
 * hérite de la couleur courante.
 *
 * Au tout premier affichage d'une session, l'anneau se déploie et le « M »
 * se dessine, puis le nom vient se poser. L'effet ne se rejoue pas aux
 * navigations suivantes — une animation d'introduction répétée à chaque
 * page devient vite agaçante. Le marqueur vit dans `sessionStorage`, donc
 * dans l'onglet seulement : rien n'est conservé d'une visite à l'autre.
 */

const CLE_SESSION = "mbm-logo-vu";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [intro, setIntro] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLE_SESSION)) return;
      sessionStorage.setItem(CLE_SESSION, "1");
    } catch {
      // Navigation privée ou stockage bloqué : on joue l'introduction,
      // sans pouvoir mémoriser qu'elle a déjà été vue.
    }

    // Respecte la préférence système : pas de tracé animé si l'utilisateur
    // a demandé moins de mouvement.
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduit) setIntro(true);
  }, []);

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3",
        intro && "logo-intro",
        className,
      )}
    >
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0 text-accent transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-[8deg]"
        aria-hidden
        fill="none"
      >
        <circle
          className="logo-ring"
          cx="20"
          cy="20"
          r="18.5"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          className="logo-mark"
          d="M11 27V13l9 10 9-10v14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Le nom est le texte accessible du lien : pas d'aria-label qui
          viendrait le remplacer par un libellé différent de ce qui est lu
          à l'écran. Les deux fragments sont séparés par une espace réelle
          pour que le nom accessible soit bien « Mate by Mathias ». */}
      {compact ? (
        <span className="sr-only">Mate by Mathias</span>
      ) : (
        <span className="logo-word flex flex-col leading-none">
          <span className="font-display text-lg tracking-[0.2em] uppercase">
            Mate
          </span>{" "}
          <span className="text-[9px] tracking-[0.42em] uppercase text-foreground-muted">
            by Mathias
          </span>
        </span>
      )}
    </Link>
  );
}
