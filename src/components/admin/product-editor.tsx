"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

import { saveProduct } from "@/app/actions/admin-catalog";
import { slugify } from "@/lib/utils";

type VariantForm = {
  id?: string;
  sku: string;
  label: string;
  priceEuros: string;
  compareAtEuros: string;
  stock: string;
  allowBackorder: boolean;
  colorName: string;
  colorHex: string;
  sizeName: string;
  weightGrams: string;
  isActive: boolean;
  imageUrls: string;
};

export type ProductFormData = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  universe: "VELOS" | "EQUIPEMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string;
  brandId: string;
  basePriceEuros: string;
  compareAtEuros: string;
  vatRate: string;
  isFeatured: boolean;
  isMadeToOrder: boolean;
  weightGrams: string;
  specs: { label: string; value: string }[];
  imageUrls: string;
  seoTitle: string;
  seoDescription: string;
  variants: VariantForm[];
};

const EMPTY_VARIANT: VariantForm = {
  sku: "",
  label: "",
  priceEuros: "",
  compareAtEuros: "",
  stock: "0",
  allowBackorder: false,
  colorName: "",
  colorHex: "",
  sizeName: "",
  weightGrams: "",
  isActive: true,
  imageUrls: "",
};

const toNumber = (value: string): number | null => {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const toLines = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Éditeur complet d'une fiche produit.
 *
 * Les photos sont saisies sous forme d'URL, une par ligne : celles d'une
 * variante remplacent les visuels génériques dès que le client sélectionne
 * la couleur correspondante.
 */
export function ProductEditor({
  initial,
  categories,
  brands,
}: {
  initial: ProductFormData;
  categories: { id: string; name: string; universe: string }[];
  brands: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setVariant(index: number, patch: Partial<VariantForm>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const payload = {
      id: form.id,
      name: form.name,
      slug: form.slug || slugify(form.name),
      tagline: form.tagline,
      description: form.description,
      universe: form.universe,
      status: form.status,
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      basePriceEuros: toNumber(form.basePriceEuros) ?? 0,
      compareAtEuros: toNumber(form.compareAtEuros),
      vatRate: Number.parseInt(form.vatRate, 10) || 20,
      isFeatured: form.isFeatured,
      isMadeToOrder: form.isMadeToOrder,
      weightGrams: form.weightGrams
        ? Number.parseInt(form.weightGrams, 10)
        : null,
      specs: form.specs.filter((s) => s.label && s.value),
      imageUrls: toLines(form.imageUrls),
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      variants: form.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        label: v.label || [v.colorName, v.sizeName].filter(Boolean).join(" / "),
        priceEuros: toNumber(v.priceEuros),
        compareAtEuros: toNumber(v.compareAtEuros),
        stock: Number.parseInt(v.stock, 10) || 0,
        allowBackorder: v.allowBackorder,
        colorName: v.colorName || null,
        colorHex: v.colorHex || null,
        sizeName: v.sizeName || null,
        weightGrams: v.weightGrams ? Number.parseInt(v.weightGrams, 10) : null,
        isActive: v.isActive,
        imageUrls: toLines(v.imageUrls),
      })),
    };

    startTransition(async () => {
      const result = await saveProduct(payload);
      if (!result.ok) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      setSaved(true);
      if (!form.id && result.id) {
        router.push(`/admin/produits/${result.id}`);
        return;
      }
      router.refresh();
    });
  }

  const availableCategories = categories.filter(
    (c) => c.universe === form.universe,
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Section title="Informations">
            <Field
              label="Nom du produit"
              value={form.name}
              onChange={(v) => {
                set("name", v);
                if (!form.id) set("slug", slugify(v));
              }}
              required
            />
            <Field
              label="Adresse (slug)"
              value={form.slug}
              onChange={(v) => set("slug", slugify(v))}
              hint="Utilisée dans l'URL : /produit/…"
            />
            <Field
              label="Accroche"
              value={form.tagline}
              onChange={(v) => set("tagline", v)}
              hint="Une ligne affichée sous le nom dans la galerie."
            />
            <label className="block">
              <span className="eyebrow">Description</span>
              <textarea
                rows={9}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
              />
              <span className="mt-1.5 block text-[11px] text-foreground-muted">
                Un paragraphe par ligne vide.
              </span>
            </label>
          </Section>

          <Section title="Caractéristiques techniques">
            {form.specs.map((spec, index) => (
              <div key={index} className="flex gap-3">
                <input
                  value={spec.label}
                  placeholder="Matériau"
                  onChange={(e) =>
                    set(
                      "specs",
                      form.specs.map((s, i) =>
                        i === index ? { ...s, label: e.target.value } : s,
                      ),
                    )
                  }
                  className="h-11 w-1/3 rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
                />
                <input
                  value={spec.value}
                  placeholder="Acier Columbus"
                  onChange={(e) =>
                    set(
                      "specs",
                      form.specs.map((s, i) =>
                        i === index ? { ...s, value: e.target.value } : s,
                      ),
                    )
                  }
                  className="h-11 flex-1 rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
                />
                <button
                  type="button"
                  aria-label="Supprimer cette caractéristique"
                  onClick={() =>
                    set(
                      "specs",
                      form.specs.filter((_, i) => i !== index),
                    )
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-red-500 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("specs", [...form.specs, { label: "", value: "" }])}
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Ajouter une ligne
            </button>
          </Section>

          <Section title="Photos du produit">
            <label className="block">
              <span className="eyebrow">Adresses des images, une par ligne</span>
              <textarea
                rows={5}
                value={form.imageUrls}
                onChange={(e) => set("imageUrls", e.target.value)}
                placeholder={"https://…/photo-1.webp\nhttps://…/photo-2.webp"}
                className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 font-mono text-[12px] outline-none focus:border-accent"
              />
              <span className="mt-1.5 block text-[11px] text-foreground-muted">
                Ces visuels s&apos;affichent par défaut. Les photos saisies sur
                une variante les remplacent dès que cette couleur est
                sélectionnée.
              </span>
            </label>
          </Section>

          <Section title="Référencement">
            <Field
              label="Titre SEO"
              value={form.seoTitle}
              onChange={(v) => set("seoTitle", v)}
              hint="Laissez vide pour reprendre le nom du produit."
            />
            <label className="block">
              <span className="eyebrow">Méta-description</span>
              <textarea
                rows={3}
                maxLength={400}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
              />
            </label>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Publication">
            <label className="block">
              <span className="eyebrow">Statut</span>
              <select
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as ProductFormData["status"])
                }
                className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </label>

            <label className="block">
              <span className="eyebrow">Univers</span>
              <select
                value={form.universe}
                onChange={(e) => {
                  set("universe", e.target.value as ProductFormData["universe"]);
                  set("categoryId", "");
                }}
                className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
              >
                <option value="VELOS">Cadres &amp; Vélos</option>
                <option value="EQUIPEMENT">Vêtements &amp; Accessoires</option>
              </select>
            </label>

            <label className="block">
              <span className="eyebrow">Catégorie</span>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">Aucune</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="eyebrow">Marque</span>
              <select
                value={form.brandId}
                onChange={(e) => set("brandId", e.target.value)}
                className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">Aucune</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <Checkbox
              label="Mettre en avant sur l'accueil"
              checked={form.isFeatured}
              onChange={(v) => set("isFeatured", v)}
            />
            <Checkbox
              label="Fabriqué sur commande (pas de droit de rétractation)"
              checked={form.isMadeToOrder}
              onChange={(v) => set("isMadeToOrder", v)}
              hint="À cocher pour toute pièce nettement personnalisée : le client en est informé sur la fiche et confirme sa renonciation avant paiement."
            />
          </Section>

          <Section title="Prix et poids">
            <Field
              label="Prix de référence (€ TTC)"
              value={form.basePriceEuros}
              onChange={(v) => set("basePriceEuros", v)}
              required
            />
            <Field
              label="Prix barré (€ TTC)"
              value={form.compareAtEuros}
              onChange={(v) => set("compareAtEuros", v)}
              hint="Laissez vide s'il n'y a pas de promotion."
            />
            <Field
              label="Taux de TVA (%)"
              value={form.vatRate}
              onChange={(v) => set("vatRate", v)}
            />
            <Field
              label="Poids (grammes)"
              value={form.weightGrams}
              onChange={(v) => set("weightGrams", v)}
              hint="Sert au calcul des frais de port."
            />
          </Section>
        </div>
      </div>

      {/* Variantes */}
      <Section title="Variantes">
        <p className="text-[12px] leading-relaxed text-foreground-muted">
          Chaque variante possède sa référence, son prix, son stock et ses
          photos. Une variante retirée du formulaire est désactivée, jamais
          supprimée : les commandes passées restent lisibles.
        </p>

        <div className="mt-5 space-y-4">
          {form.variants.map((variant, index) => (
            <div key={index} className="card-soft p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-[0.16em] text-accent">
                  Variante {index + 1}
                </h3>
                {form.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "variants",
                        form.variants.filter((_, i) => i !== index),
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Retirer
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Référence (SKU)"
                  value={variant.sku}
                  onChange={(v) => setVariant(index, { sku: v })}
                  required
                />
                <Field
                  label="Libellé"
                  value={variant.label}
                  onChange={(v) => setVariant(index, { label: v })}
                  hint="Ex. Noir mat / 56"
                />
                <Field
                  label="Couleur"
                  value={variant.colorName}
                  onChange={(v) => setVariant(index, { colorName: v })}
                />
                <label className="block">
                  <span className="eyebrow">Pastille</span>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="color"
                      value={variant.colorHex || "#000000"}
                      onChange={(e) =>
                        setVariant(index, { colorHex: e.target.value })
                      }
                      className="h-11 w-12 shrink-0 cursor-pointer rounded-sm border border-line bg-transparent"
                      aria-label="Choisir la couleur"
                    />
                    <input
                      value={variant.colorHex}
                      placeholder="#1a1a18"
                      onChange={(e) =>
                        setVariant(index, { colorHex: e.target.value })
                      }
                      className="h-11 w-full rounded-sm border border-line bg-transparent px-3 font-mono text-[12px] outline-none focus:border-accent"
                    />
                  </div>
                </label>

                <Field
                  label="Taille"
                  value={variant.sizeName}
                  onChange={(v) => setVariant(index, { sizeName: v })}
                />
                <Field
                  label="Prix (€ TTC)"
                  value={variant.priceEuros}
                  onChange={(v) => setVariant(index, { priceEuros: v })}
                  hint="Vide = prix de référence"
                />
                <Field
                  label="Prix barré (€)"
                  value={variant.compareAtEuros}
                  onChange={(v) => setVariant(index, { compareAtEuros: v })}
                />
                <Field
                  label="Stock"
                  value={variant.stock}
                  onChange={(v) => setVariant(index, { stock: v })}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Poids (grammes)"
                  value={variant.weightGrams}
                  onChange={(v) => setVariant(index, { weightGrams: v })}
                />
                <div className="flex flex-col justify-end gap-2">
                  <Checkbox
                    label="Vente possible en rupture (précommande)"
                    checked={variant.allowBackorder}
                    onChange={(v) => setVariant(index, { allowBackorder: v })}
                  />
                  <Checkbox
                    label="Variante active"
                    checked={variant.isActive}
                    onChange={(v) => setVariant(index, { isActive: v })}
                  />
                </div>
              </div>

              <label className="mt-4 block">
                <span className="eyebrow">
                  Photos de cette variante, une adresse par ligne
                </span>
                <textarea
                  rows={3}
                  value={variant.imageUrls}
                  onChange={(e) =>
                    setVariant(index, { imageUrls: e.target.value })
                  }
                  className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 font-mono text-[12px] outline-none focus:border-accent"
                />
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => set("variants", [...form.variants, { ...EMPTY_VARIANT }])}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Ajouter une variante
        </button>
      </Section>

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="flex items-center gap-2 text-[12px] text-accent" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Produit enregistré.
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 border-t border-line bg-surface px-6 py-4 lg:-mx-10 lg:px-10">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 bg-foreground px-8 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer le produit
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-soft p-6">
      <h2 className="eyebrow">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input
        value={value}
        required={required}
        maxLength={600}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
      />
      {hint && (
        <span className="mt-1.5 block text-[11px] text-foreground-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-foreground-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
      />
      <span>
        {label}
        {hint && <span className="mt-1 block text-[11px] opacity-80">{hint}</span>}
      </span>
    </label>
  );
}
