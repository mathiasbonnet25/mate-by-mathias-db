import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

// Les actions sont en pilule : c'est la forme la plus douce possible, et
// elle distingue immédiatement ce qui se clique de ce qui se lit.
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "uppercase tracking-[0.16em] transition-all duration-500 " +
  "ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-surface shadow-[var(--shadow-soft)] " +
    "hover:bg-accent hover:text-accent-contrast hover:shadow-[var(--shadow-lifted)]",
  gold:
    "bg-accent text-accent-contrast shadow-[var(--shadow-soft)] " +
    "hover:brightness-110 hover:shadow-[var(--shadow-lifted)]",
  outline:
    "border border-line text-foreground hover:border-accent hover:text-accent",
  ghost: "text-foreground-muted hover:text-accent",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-[10px]",
  md: "h-12 px-8 text-[11px]",
  lg: "h-14 px-11 text-xs",
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
