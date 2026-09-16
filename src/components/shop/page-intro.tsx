import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

/**
 * Bandeau d'ouverture des pages boutique : fil d'Ariane, titre et chapô.
 * Le fil d'Ariane est également repris en données structurées par la page.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: { name: string; path: string }[];
}) {
  return (
    <div className="container-page pb-16 pt-[132px] md:pb-20 md:pt-[168px]">
      <Reveal>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Fil d'Ariane" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>/</span>}
                  {index === breadcrumb.length - 1 ? (
                    <span aria-current="page">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.path} className="hover:text-accent">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-4 max-w-3xl text-balance font-display text-5xl leading-[1.05] md:text-6xl lg:text-7xl">
          {title}
        </h1>
        {description && (
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground-muted">
            {description}
          </p>
        )}
        <div className="rule-gold mt-12" />
      </Reveal>
    </div>
  );
}
