"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/components/shop/cart-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Cadres & Vélos", href: "/velos" },
  { label: "Vêtements & Accessoires", href: "/equipement" },
  { label: "Atelier personnalisation", href: "/personnalisation" },
  { label: "À propos", href: "/a-propos" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  // Ferme le menu mobile à chaque navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Empêche le défilement de l'arrière-plan quand le menu plein écran est ouvert.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const onHome = pathname === "/";
  const transparent = onHome && !scrolled && !menuOpen;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          transparent ? "text-white" : "text-foreground",
          scrolled && !menuOpen ? "px-3 pt-3 md:px-6 md:pt-4" : "px-0 pt-0",
        )}
      >
        <div
          className={cn(
            "container-page flex items-center justify-between gap-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            scrolled && !menuOpen
              ? "h-16 rounded-full border border-line bg-surface/80 shadow-[var(--shadow-soft)] backdrop-blur-xl"
              : "h-[76px] rounded-none border border-transparent bg-transparent",
            menuOpen && "bg-surface",
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={pathname.startsWith(item.href)}
                className="link-underline text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/recherche"
              aria-label="Rechercher"
              className="grid h-10 w-10 place-items-center rounded-full transition-all duration-400 hover:bg-foreground/5 hover:text-accent"
            >
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <ThemeToggle className="grid h-10 w-10 place-items-center rounded-full transition-all duration-400 hover:bg-foreground/5 hover:text-accent" />
            <Link
              href="/compte"
              aria-label="Mon compte"
              className="hidden h-10 w-10 place-items-center rounded-full transition-all duration-400 hover:bg-foreground/5 hover:text-accent sm:grid"
            >
              <User className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <Link
              href="/panier"
              aria-label={`Panier${count > 0 ? ` — ${count} article${count > 1 ? "s" : ""}` : " vide"}`}
              className="relative grid h-10 w-10 place-items-center rounded-full transition-all duration-400 hover:bg-foreground/5 hover:text-accent"
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-contrast"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="grid h-10 w-10 place-items-center rounded-full transition-all duration-400 hover:bg-foreground/5 hover:text-accent lg:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="menu-mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 bg-surface pt-[72px] lg:hidden"
          >
            <nav className="container-page flex flex-col gap-2 py-10">
              {NAV.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.5 }}
                >
                  <Link
                    href={item.href}
                    className="block rounded-lg px-5 py-5 font-display text-3xl transition-all duration-400 hover:bg-surface-muted hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/compte"
                className="mt-6 text-[11px] uppercase tracking-[0.22em] text-foreground-muted hover:text-accent"
              >
                Mon compte
              </Link>
              <Link
                href="/contact"
                className="mt-3 text-[11px] uppercase tracking-[0.22em] text-foreground-muted hover:text-accent"
              >
                Contact
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
