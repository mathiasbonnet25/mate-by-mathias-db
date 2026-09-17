import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Signature typographique de la marque. Le monogramme « M » est tracé en
 * SVG pour rester net à toutes les tailles et hériter de la couleur courante.
 */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-3", className)}
    >
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0 text-accent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[8deg]"
        aria-hidden
        fill="none"
      >
        <circle
          cx="20"
          cy="20"
          r="18.5"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
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
        <span className="flex flex-col leading-none">
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
