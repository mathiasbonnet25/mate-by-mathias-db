"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Bascule clair/sombre. La préférence est conservée dans localStorage ;
 * ce stockage technique ne relève pas du consentement aux traceurs car il
 * ne sert qu'à restituer un réglage d'affichage demandé par l'utilisateur.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("mbm-theme") as Theme | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(stored ?? system);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("mbm-theme", next);
    } catch {
      // Navigation privée ou stockage bloqué : le thème reste valable
      // pour la session en cours.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={
        theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"
      }
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}

/**
 * Script injecté avant l'hydratation : applique le thème enregistré dès la
 * première peinture pour éviter un flash de thème clair.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('mbm-theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', stored || system);
  } catch (e) {}
})();
`;
