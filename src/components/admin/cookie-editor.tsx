"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Lock, Pencil, Plus, Power, Trash2 } from "lucide-react";

import {
  deleteTracker,
  saveCookieCategory,
  saveTracker,
  toggleTracker,
} from "@/app/actions/admin-content";

/**
 * Déclaration des catégories de traceurs et des outils tiers.
 *
 * Ce que l'on écrit ici est repris mot pour mot dans le bandeau de
 * consentement et la politique de cookies : c'est le texte que lira la
 * personne au moment de décider. Il doit donc être compréhensible sans
 * connaissance technique.
 *
 * Le caractère « strictement nécessaire » d'une catégorie n'est pas
 * modifiable : c'est lui qui détermine si les traceurs échappent au
 * consentement. Le basculer par mégarde reviendrait à déposer des
 * traceurs sans accord.
 */

export type CategorieRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  isEssential: boolean;
  position: number;
  isActive: boolean;
  trackers: TraceurRow[];
};

export type TraceurRow = {
  id: string;
  name: string;
  vendor: string;
  purpose: string;
  retention: string | null;
  recipientCountry: string | null;
  isActive: boolean;
};

export function CookieEditor({ categories }: { categories: CategorieRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [retour, setRetour] = useState<string | null>(null);
  const [categorieEditee, setCategorieEditee] = useState<string | null>(null);
  const [nouvelleCategorie, setNouvelleCategorie] = useState(false);
  const [traceurEdite, setTraceurEdite] = useState<string | null>(null);
  const [nouveauTraceurDans, setNouveauTraceurDans] = useState<string | null>(null);

  function lancer(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    succes: string,
    apres?: () => void,
  ) {
    setErreur(null);
    setRetour(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setErreur(r.error ?? "Opération impossible.");
        return;
      }
      setRetour(succes);
      apres?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-[12px] leading-relaxed text-foreground-muted">
          Chaque outil tiers doit être déclaré ici. Il apparaît alors dans la
          politique de cookies avec sa finalité et sa durée de conservation, et
          peut être coupé immédiatement en cas de doute.
        </p>
        <button
          type="button"
          onClick={() => {
            setNouvelleCategorie(true);
            setCategorieEditee(null);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nouvelle catégorie
        </button>
      </div>

      {nouvelleCategorie && (
        <FormulaireCategorie
          onClose={() => setNouvelleCategorie(false)}
          onSave={(valeurs) =>
            lancer(() => saveCookieCategory(valeurs), "Catégorie créée.", () =>
              setNouvelleCategorie(false),
            )
          }
          pending={pending}
          position={categories.length}
        />
      )}

      {categories.map((categorie) => (
        <section key={categorie.id} className="card-soft p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="flex flex-wrap items-center gap-2 font-display text-xl">
                {categorie.name}
                {categorie.isEssential && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-accent">
                    <Lock className="h-3 w-3" aria-hidden />
                    Exempte de consentement
                  </span>
                )}
                {!categorie.isActive && (
                  <span className="rounded-full border border-line px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                    Masquée
                  </span>
                )}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground-muted">
                {categorie.description}
              </p>
              <p className="mt-1 text-[11px] text-foreground-muted">
                Identifiant : <code className="font-mono">{categorie.slug}</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setCategorieEditee(
                  categorieEditee === categorie.id ? null : categorie.id,
                )
              }
              aria-label={`Modifier « ${categorie.name} »`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          {categorieEditee === categorie.id && (
            <div className="mt-5">
              <FormulaireCategorie
                initial={categorie}
                onClose={() => setCategorieEditee(null)}
                onSave={(valeurs) =>
                  lancer(
                    () => saveCookieCategory({ ...valeurs, id: categorie.id }),
                    "Catégorie enregistrée.",
                    () => setCategorieEditee(null),
                  )
                }
                pending={pending}
                position={categorie.position}
              />
            </div>
          )}

          {/* Traceurs de la catégorie */}
          <div className="mt-6 space-y-3 border-t border-line pt-6">
            {categorie.trackers.length === 0 && (
              <p className="text-[13px] text-foreground-muted">
                Aucun traceur déclaré dans cette catégorie.
              </p>
            )}

            {categorie.trackers.map((t) => (
              <div key={t.id} className="rounded-md border border-line p-4">
                {traceurEdite === t.id ? (
                  <FormulaireTraceur
                    initial={t}
                    categoryId={categorie.id}
                    onClose={() => setTraceurEdite(null)}
                    onSave={(valeurs) =>
                      lancer(
                        () => saveTracker({ ...valeurs, id: t.id }),
                        "Traceur enregistré.",
                        () => setTraceurEdite(null),
                      )
                    }
                    pending={pending}
                  />
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {t.name}
                        <span className="ml-2 text-[11px] text-foreground-muted">
                          {t.vendor}
                          {t.recipientCountry ? ` · ${t.recipientCountry}` : ""}
                        </span>
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-foreground-muted">
                        {t.purpose}
                      </p>
                      {t.retention && (
                        <p className="mt-1 text-[11px] text-foreground-muted">
                          Conservation : {t.retention}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          lancer(
                            () => toggleTracker(t.id, !t.isActive),
                            t.isActive ? "Traceur coupé." : "Traceur réactivé.",
                          )
                        }
                        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                          t.isActive
                            ? "border-accent text-accent hover:border-red-500 hover:text-red-500"
                            : "border-line text-foreground-muted hover:border-accent hover:text-accent"
                        }`}
                      >
                        <Power className="h-3 w-3" aria-hidden />
                        {t.isActive ? "Actif" : "Inactif"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTraceurEdite(t.id)}
                        aria-label={`Modifier ${t.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full text-foreground-muted transition-colors hover:text-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>

                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          lancer(() => deleteTracker(t.id), "Traceur supprimé.")
                        }
                        aria-label={`Supprimer ${t.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full text-foreground-muted transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {nouveauTraceurDans === categorie.id ? (
              <div className="rounded-md border border-accent/50 p-4">
                <FormulaireTraceur
                  categoryId={categorie.id}
                  onClose={() => setNouveauTraceurDans(null)}
                  onSave={(valeurs) =>
                    lancer(() => saveTracker(valeurs), "Traceur déclaré.", () =>
                      setNouveauTraceurDans(null),
                    )
                  }
                  pending={pending}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNouveauTraceurDans(categorie.id)}
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Déclarer un traceur
              </button>
            )}
          </div>
        </section>
      ))}

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
    </div>
  );
}

function FormulaireCategorie({
  initial,
  position,
  onClose,
  onSave,
  pending,
}: {
  initial?: CategorieRow;
  position: number;
  onClose: () => void;
  onSave: (valeurs: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    isActive: initial?.isActive ?? true,
  });

  return (
    <div className="rounded-md border border-accent/50 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="Nom affiché"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <Champ
          label="Identifiant"
          value={form.slug}
          onChange={(v) =>
            setForm((f) => ({ ...f, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))
          }
          aide="Minuscules, sans espace. Ne pas modifier sur une catégorie déjà en service."
        />
      </div>

      <label className="mt-4 block">
        <span className="text-[11px] text-foreground-muted">
          Finalité, en termes compréhensibles
        </span>
        <textarea
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1.5 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
        />
        <span className="mt-1.5 block text-[11px] text-foreground-muted">
          Ce texte est repris tel quel dans le bandeau de consentement.
        </span>
      </label>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[12px] text-foreground-muted">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-3.5 w-3.5 accent-[var(--accent)]"
        />
        Proposée dans le bandeau de consentement
      </label>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave({ ...form, position })}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function FormulaireTraceur({
  initial,
  categoryId,
  onClose,
  onSave,
  pending,
}: {
  initial?: TraceurRow;
  categoryId: string;
  onClose: () => void;
  onSave: (valeurs: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    vendor: initial?.vendor ?? "",
    purpose: initial?.purpose ?? "",
    retention: initial?.retention ?? "",
    recipientCountry: initial?.recipientCountry ?? "",
    isActive: initial?.isActive ?? true,
  });

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Champ
          label="Nom du traceur"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          aide="Tel qu'il apparaît dans le navigateur"
        />
        <Champ
          label="Émetteur"
          value={form.vendor}
          onChange={(v) => setForm((f) => ({ ...f, vendor: v }))}
        />
        <Champ
          label="Durée de conservation"
          value={form.retention}
          onChange={(v) => setForm((f) => ({ ...f, retention: v }))}
          aide="Ex. 13 mois"
        />
        <Champ
          label="Pays du destinataire"
          value={form.recipientCountry}
          onChange={(v) => setForm((f) => ({ ...f, recipientCountry: v }))}
          aide="À renseigner si hors Union européenne"
        />
      </div>

      <label className="mt-4 block">
        <span className="text-[11px] text-foreground-muted">Finalité</span>
        <textarea
          rows={2}
          maxLength={1000}
          value={form.purpose}
          onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
          className="mt-1.5 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave({ ...form, categoryId })}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
  aide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  aide?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-foreground-muted">{label}</span>
      <input
        value={value}
        maxLength={300}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
      />
      {aide && (
        <span className="mt-1 block text-[10px] text-foreground-muted">{aide}</span>
      )}
    </label>
  );
}
