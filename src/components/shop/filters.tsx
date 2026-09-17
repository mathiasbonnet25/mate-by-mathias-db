"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, Check } from "lucide-react";

import { formatPrice } from "@/lib/utils";

export type Facets = {
  categories: { slug: string; name: string; _count: { products: number } }[];
  brands: { slug: string; name: string }[];
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  minPriceCents: number;
  maxPriceCents: number;
};

const SORTS = [
  { value: "recent", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "name", label: "Ordre alphabétique" },
];

/**
 * Filtres du catalogue.
 *
 * L'état vit dans l'URL : un filtrage est donc partageable, indexable et
 * restauré par le bouton « précédent ». Le composant est scindé en deux
 * parties pour que chacune trouve sa place dans la grille : le panneau dans
 * la colonne de gauche, la barre d'outils au-dessus des produits.
 */
function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const selected = useCallback(
    (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [],
    [params],
  );

  const update = useCallback(
    (next: URLSearchParams) => {
      next.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = selected(key);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length) next.set(key, updated.join(","));
      else next.delete(key);
      update(next);
    },
    [params, selected, update],
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      update(next);
    },
    [params, update],
  );

  const activeCount =
    selected("categorie").length +
    selected("marque").length +
    selected("couleur").length +
    selected("taille").length +
    (params.get("prixMax") ? 1 : 0) +
    (params.get("dispo") ? 1 : 0);

  return { params, pending, selected, toggle, setSingle, update, activeCount };
}

/** Panneau de filtres, affiché en colonne sur grand écran. */
function FilterPanel({ facets }: { facets: Facets }) {
  const { params, selected, toggle, setSingle, update, activeCount } =
    useFilterState();

  return (
    <div className="space-y-10">
      {facets.categories.length > 0 && (
        <FilterGroup title="Type">
          {facets.categories.map((c) => (
            <CheckboxRow
              key={c.slug}
              label={`${c.name} (${c._count.products})`}
              checked={selected("categorie").includes(c.slug)}
              onChange={() => toggle("categorie", c.slug)}
            />
          ))}
        </FilterGroup>
      )}

      {facets.brands.length > 0 && (
        <FilterGroup title="Marque">
          {facets.brands.map((b) => (
            <CheckboxRow
              key={b.slug}
              label={b.name}
              checked={selected("marque").includes(b.slug)}
              onChange={() => toggle("marque", b.slug)}
            />
          ))}
        </FilterGroup>
      )}

      {facets.sizes.length > 0 && (
        <FilterGroup title="Taille">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = selected("taille").includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggle("taille", size)}
                  aria-pressed={active}
                  className={`h-9 min-w-11 border px-3 text-[11px] uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? "border-accent bg-accent text-accent-contrast"
                      : "border-line hover:border-accent"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {facets.colors.length > 0 && (
        <FilterGroup title="Couleur">
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((color) => {
              const active = selected("couleur").includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggle("couleur", color.name)}
                  aria-pressed={active}
                  aria-label={color.name}
                  title={color.name}
                  className={`relative grid h-8 w-8 place-items-center rounded-full border transition-all ${
                    active ? "border-accent ring-1 ring-accent ring-offset-2 ring-offset-[var(--surface)]" : "border-line"
                  }`}
                  style={{ backgroundColor: color.hex ?? "transparent" }}
                >
                  {active && (
                    <Check className="h-3.5 w-3.5 text-white mix-blend-difference" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Prix maximum">
        <input
          type="range"
          min={facets.minPriceCents}
          max={facets.maxPriceCents}
          step={5000}
          defaultValue={params.get("prixMax") ?? facets.maxPriceCents}
          onMouseUp={(e) =>
            setSingle("prixMax", (e.target as HTMLInputElement).value)
          }
          onTouchEnd={(e) =>
            setSingle("prixMax", (e.target as HTMLInputElement).value)
          }
          className="w-full accent-[var(--accent)]"
          aria-label="Prix maximum"
        />
        <div className="mt-2 flex justify-between text-[11px] text-foreground-muted">
          <span>{formatPrice(facets.minPriceCents)}</span>
          <span>
            {formatPrice(
              Number(params.get("prixMax") ?? facets.maxPriceCents),
            )}
          </span>
        </div>
      </FilterGroup>

      <FilterGroup title="Disponibilité">
        <CheckboxRow
          label="En stock uniquement"
          checked={params.get("dispo") === "1"}
          onChange={() =>
            setSingle("dispo", params.get("dispo") === "1" ? null : "1")
          }
        />
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => update(new URLSearchParams())}
          className="text-[11px] uppercase tracking-[0.16em] text-accent underline underline-offset-4"
        >
          Effacer tous les filtres
        </button>
      )}
    </div>
  );
}

/**
 * Barre d'outils : compteur, tri et, sur petit écran, le tiroir contenant
 * le même panneau de filtres.
 */
export function FilterToolbar({
  facets,
  total,
}: {
  facets: Facets;
  total: number;
}) {
  const { params, pending, setSingle, activeCount } = useFilterState();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="mb-10 flex items-center justify-between gap-4 border-b border-line pb-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-foreground-muted">
          {pending ? "Chargement…" : `${total} produit${total > 1 ? "s" : ""}`}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filtres
            {activeCount > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] text-accent-contrast">
                {activeCount}
              </span>
            )}
          </button>

          <label className="flex items-center gap-2">
            <span className="sr-only">Trier par</span>
            <select
              value={params.get("tri") ?? "recent"}
              onChange={(e) => setSingle("tri", e.target.value)}
              className="cursor-pointer rounded-sm border border-line bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.16em] outline-none transition-colors hover:border-accent"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-[var(--overlay)] lg:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[86%] max-w-sm overflow-y-auto bg-surface p-7"
              role="dialog"
              aria-modal="true"
              aria-label="Filtres"
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-display text-2xl">Filtres</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fermer les filtres"
                  className="grid h-9 w-9 place-items-center"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <FilterPanel facets={facets} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full mt-10 h-12 w-full bg-accent text-[11px] uppercase tracking-[0.18em] text-accent-contrast"
              >
                Voir les {total} produits
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="eyebrow">{title}</h3>
      <div className="mt-4 space-y-2.5">{children}</div>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[13px] text-foreground-muted transition-colors hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

/** Colonne de filtres du catalogue, sur grand écran. */
export function FilterSidebar({ facets }: { facets: Facets }) {
  return (
    <aside className="hidden lg:block" aria-label="Filtres">
      <h2 className="sr-only">Filtrer les produits</h2>
      <FilterPanel facets={facets} />
    </aside>
  );
}
