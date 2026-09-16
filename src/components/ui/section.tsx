import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

/**
 * Enveloppe de section : rythme vertical généreux et en-tête homogène.
 * L'espace est l'élément de luxe le moins coûteux et le plus efficace.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  muted = false,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 md:py-28 lg:py-[var(--spacing-section)]",
        muted && "bg-surface-muted",
        className,
      )}
    >
      <div className="container-page">
        {(eyebrow || title || description || action) && (
          <Reveal>
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                {title && (
                  <h2 className="mt-4 text-balance font-display text-4xl leading-[1.1] md:text-5xl">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-6 text-base leading-relaxed text-foreground-muted">
                    {description}
                  </p>
                )}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
          </Reveal>
        )}
        <div className={cn(eyebrow || title ? "mt-14 md:mt-16" : undefined)}>
          {children}
        </div>
      </div>
    </section>
  );
}
