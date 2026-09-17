"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

import { saveCustomizationOptions } from "@/app/actions/admin-content";
import { formatPrice, slugify } from "@/lib/utils";

/**
 * Barème de l'atelier de personnalisation.
 *
 * Le calcul appliqué au client est :
 *
 *   prix du support
 *     × multiplicateur du type de peinture
 *     × multiplicateur de la finition
 *     + somme des options
 *
 * D'où les deux colonnes : un support porte un prix, une peinture porte
 * un multiplicateur. Un aperçu recalculé en direct évite d'avoir à
 * publier pour vérifier l'effet d'un réglage.
 */

type Etape = "SUPPORT" | "PAINT" | "FINISH" | "EXTRA";

export type OptionForm = {
  id?: string;
  step: Etape;
  slug: string;
  label: string;
  description: string;
  priceEuros: string;
  multiplier: string;
  isMultiple: boolean;
  isActive: boolean;
};

const ETAPES: {
  cle: Etape;
  titre: string;
  aide: string;
  colonne: "prix" | "multiplicateur";
}[] = [
  {
    cle: "SUPPORT",
    titre: "1. La pièce",
    aide: "Le prix de base du projet. Tout le reste se calcule à partir de là.",
    colonne: "prix",
  },
  {
    cle: "PAINT",
    titre: "2. Le type de peinture",
    aide: "Un multiplicateur appliqué au prix du support. 1,00 laisse le prix inchangé ; 1,50 l'augmente de moitié.",
    colonne: "multiplicateur",
  },
  {
    cle: "FINISH",
    titre: "3. La finition",
    aide: "Second multiplicateur, appliqué après celui de la peinture.",
    colonne: "multiplicateur",
  },
  {
    cle: "EXTRA",
    titre: "4. Les options",
    aide: "Montants fixes, ajoutés au total. Plusieurs options peuvent être cumulées par le client.",
    colonne: "prix",
  },
];

const nombre = (v: string) => {
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function CustomizationEditor({ initial }: { initial: OptionForm[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [options, setOptions] = useState(initial);
  const [retour, setRetour] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function modifier(index: number, patch: Partial<OptionForm>) {
    setOptions((liste) =>
      liste.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    );
  }

  /** Aperçu : projet le plus cher configurable avec le barème courant. */
  function apercu(): { min: number; max: number } {
    const actives = options.filter((o) => o.isActive);
    const supports = actives.filter((o) => o.step === "SUPPORT");
    const peintures = actives.filter((o) => o.step === "PAINT");
    const finitions = actives.filter((o) => o.step === "FINISH");
    const extras = actives.filter((o) => o.step === "EXTRA");

    if (supports.length === 0) return { min: 0, max: 0 };

    const calcule = (choix: "min" | "max") => {
      const prix = (liste: OptionForm[]) =>
        liste.map((o) => nombre(o.priceEuros));
      const mult = (liste: OptionForm[]) =>
        liste.length ? liste.map((o) => nombre(o.multiplier)) : [1];

      const base =
        choix === "min"
          ? Math.min(...prix(supports))
          : Math.max(...prix(supports));
      const p =
        choix === "min" ? Math.min(...mult(peintures)) : Math.max(...mult(peintures));
      const f =
        choix === "min" ? Math.min(...mult(finitions)) : Math.max(...mult(finitions));
      const supplements =
        choix === "min"
          ? 0
          : prix(extras).reduce((s, v) => s + v, 0);

      return Math.round(base * p * f + supplements);
    };

    return { min: calcule("min"), max: calcule("max") };
  }

  function enregistrer() {
    setErreur(null);
    setRetour(null);

    // Deux options de même identifiant dans une étape écraseraient l'une
    // l'autre en base : la contrainte porte sur le couple (étape, slug).
    const vus = new Set<string>();
    for (const o of options) {
      const cle = `${o.step}:${o.slug}`;
      if (vus.has(cle)) {
        setErreur(`Deux options portent l'identifiant « ${o.slug} ».`);
        return;
      }
      vus.add(cle);
      if (!o.slug || !o.label) {
        setErreur("Chaque option doit avoir un identifiant et un libellé.");
        return;
      }
    }

    startTransition(async () => {
      const resultat = await saveCustomizationOptions({
        options: options.map((o, index) => ({
          id: o.id,
          step: o.step,
          slug: o.slug,
          label: o.label,
          description: o.description || undefined,
          priceEuros: nombre(o.priceEuros),
          multiplier: nombre(o.multiplier) || 1,
          isMultiple: o.isMultiple,
          isActive: o.isActive,
          position: index,
        })),
      });

      if (!resultat.ok) {
        setErreur(resultat.error ?? "Enregistrement impossible.");
        return;
      }
      setRetour("Barème enregistré. Il s'applique immédiatement sur le site.");
      router.refresh();
    });
  }

  const { min, max } = apercu();

  return (
    <div className="space-y-4">
      <section className="card-soft p-6">
        <h2 className="eyebrow">Aperçu du barème</h2>
        <p className="mt-4 text-sm text-foreground-muted">
          Avec les options actives, l&apos;estimateur affichera entre{" "}
          <strong className="text-foreground">{formatPrice(min * 100)}</strong> et{" "}
          <strong className="text-foreground">{formatPrice(max * 100)}</strong>.
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-foreground-muted">
          Rappel : ce montant reste une estimation. Le client en est informé
          sur la page de l&apos;atelier, et cette mention ne peut pas être
          retirée.
        </p>
      </section>

      {ETAPES.map((etape) => {
        const lignes = options
          .map((o, index) => ({ o, index }))
          .filter(({ o }) => o.step === etape.cle);

        return (
          <section key={etape.cle} className="card-soft p-6">
            <h2 className="eyebrow">{etape.titre}</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground-muted">
              {etape.aide}
            </p>

            <div className="mt-6 space-y-3">
              {lignes.map(({ o, index }) => (
                <div
                  key={`${o.step}-${index}`}
                  className="rounded-md border border-line p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Champ
                      label="Libellé"
                      value={o.label}
                      onChange={(v) =>
                        modifier(index, {
                          label: v,
                          slug: o.id ? o.slug : slugify(v),
                        })
                      }
                    />
                    <Champ
                      label="Identifiant"
                      value={o.slug}
                      onChange={(v) => modifier(index, { slug: slugify(v) })}
                      aide={o.id ? "Ne pas modifier sur une option existante" : undefined}
                    />

                    {etape.colonne === "prix" ? (
                      <Champ
                        label="Prix (€ TTC)"
                        value={o.priceEuros}
                        onChange={(v) => modifier(index, { priceEuros: v })}
                      />
                    ) : (
                      <Champ
                        label="Multiplicateur"
                        value={o.multiplier}
                        onChange={(v) => modifier(index, { multiplier: v })}
                        aide="1,00 = prix inchangé"
                      />
                    )}

                    <div className="flex flex-col justify-end gap-2 pb-1">
                      <Case
                        label="Active"
                        checked={o.isActive}
                        onChange={(v) => modifier(index, { isActive: v })}
                      />
                      {etape.cle === "EXTRA" && (
                        <Case
                          label="Cumulable"
                          checked={o.isMultiple}
                          onChange={(v) => modifier(index, { isMultiple: v })}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-end gap-3">
                    <Champ
                      label="Description"
                      value={o.description}
                      onChange={(v) => modifier(index, { description: v })}
                      pleine
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((liste) => liste.filter((_, i) => i !== index))
                      }
                      aria-label={`Retirer « ${o.label} »`}
                      className="mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-red-500 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setOptions((liste) => [
                  ...liste,
                  {
                    step: etape.cle,
                    slug: "",
                    label: "",
                    description: "",
                    priceEuros: "0",
                    multiplier: "1",
                    isMultiple: etape.cle === "EXTRA",
                    isActive: true,
                  },
                ])
              }
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Ajouter une option
            </button>
          </section>
        );
      })}

      {erreur && (
        <p className="text-[12px] text-red-500" role="alert">
          {erreur}
        </p>
      )}
      {retour && (
        <p className="flex items-center gap-2 text-[12px] text-accent" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {retour}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 border-t border-line bg-surface px-6 py-4 lg:-mx-10 lg:px-10">
        <button
          type="button"
          onClick={enregistrer}
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-8 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer le barème
        </button>
        <p className="mt-2 text-[11px] text-foreground-muted">
          Une option retirée de cet écran reste en base et cesse simplement
          d&apos;être proposée. Les devis déjà enregistrés gardent les
          libellés et montants qui étaient en vigueur.
        </p>
      </div>
    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
  aide,
  pleine = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  aide?: string;
  pleine?: boolean;
}) {
  return (
    <label className={pleine ? "block flex-1" : "block"}>
      <span className="text-[11px] text-foreground-muted">{label}</span>
      <input
        value={value}
        maxLength={600}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
      />
      {aide && (
        <span className="mt-1 block text-[10px] text-foreground-muted">
          {aide}
        </span>
      )}
    </label>
  );
}

function Case({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-foreground-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
