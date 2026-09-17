"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink } from "lucide-react";

const DEVICES = [
  { key: "desktop", label: "Ordinateur", width: 1440, height: 900, Icon: Monitor },
  { key: "tablet", label: "Tablette", width: 834, height: 1112, Icon: Tablet },
  { key: "mobile", label: "Téléphone", width: 390, height: 844, Icon: Smartphone },
] as const;

const PAGES = [
  { path: "/", label: "Accueil" },
  { path: "/velos", label: "Cadres & Vélos" },
  { path: "/equipement", label: "Vêtements & Accessoires" },
  { path: "/personnalisation", label: "Atelier personnalisation" },
  { path: "/a-propos", label: "À propos" },
  { path: "/contact", label: "Contact" },
  { path: "/panier", label: "Panier" },
  { path: "/cgv", label: "CGV" },
  { path: "/confidentialite", label: "Confidentialité" },
  { path: "/cookies", label: "Cookies" },
];

/**
 * Aperçu du site aux trois formats, avant publication.
 *
 * Le rendu est celui du site réel dans un cadre dimensionné : c'est le même
 * code et les mêmes styles, ce qui évite les écarts entre un aperçu simulé
 * et la page servie aux visiteurs.
 */
export function ResponsivePreview() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("desktop");
  const [path, setPath] = useState("/");
  const [reloadKey, setReloadKey] = useState(0);

  const current = DEVICES.find((d) => d.key === device)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-surface p-5">
        <div>
          <span className="eyebrow">Format</span>
          <div className="mt-2 flex gap-1">
            {DEVICES.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                aria-pressed={device === key}
                className={`inline-flex h-11 items-center gap-2 border px-4 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  device === key
                    ? "border-accent text-accent"
                    : "border-line hover:border-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="min-w-48">
          <span className="eyebrow">Page</span>
          <select
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
          >
            {PAGES.map((page) => (
              <option key={page.path} value={page.path}>
                {page.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Recharger
        </button>

        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Ouvrir
        </a>

        <p className="text-[11px] text-foreground-muted">
          {current.width} × {current.height} px
        </p>
      </div>

      <div className="flex justify-center overflow-auto rounded-lg border border-line bg-surface-muted p-6">
        <div
          className="shrink-0 overflow-hidden rounded-md border border-line bg-white shadow-[var(--shadow-lifted)]"
          style={{
            width: current.width,
            height: current.height,
            // L'aperçu est réduit pour tenir à l'écran sans perdre la
            // largeur réelle prise en compte par les points de rupture.
            transform: device === "desktop" ? "scale(0.62)" : "scale(0.85)",
            transformOrigin: "top center",
            marginBottom:
              device === "desktop"
                ? -current.height * 0.38
                : -current.height * 0.15,
          }}
        >
          <iframe
            key={`${device}-${path}-${reloadKey}`}
            src={path}
            title={`Aperçu ${current.label} de la page ${path}`}
            className="h-full w-full"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    </div>
  );
}
