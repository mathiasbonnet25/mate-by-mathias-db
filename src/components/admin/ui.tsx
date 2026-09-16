import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** En-tête de page d'administration. */
export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="font-display text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-line bg-surface p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title && <h2 className="eyebrow">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {hint && (
        <p className="mt-1.5 text-[11px] text-foreground-muted">{hint}</p>
      )}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="block border border-line bg-surface p-6 transition-colors hover:border-accent/50"
    >
      {body}
    </Link>
  ) : (
    <div className="border border-line bg-surface p-6">{body}</div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="border border-dashed border-line p-10 text-center text-sm text-foreground-muted">
      {message}
    </p>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "danger" | "success";
}) {
  const tones = {
    neutral: "border-line text-foreground-muted",
    accent: "border-accent/60 text-accent",
    danger: "border-red-500/60 text-red-500",
    success: "border-emerald-500/60 text-emerald-600",
  };
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
