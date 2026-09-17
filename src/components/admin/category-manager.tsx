"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  deleteCategory,
  reorderCategories,
  saveCategory,
} from "@/app/actions/admin-catalog";
import { slugify } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  universe: "VELOS" | "EQUIPEMENT";
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  productCount: number;
};

/**
 * Gestion des catégories : création, modification, suppression et
 * réorganisation par glisser-déposer. Le nouvel ordre n'est envoyé au
 * serveur qu'une fois le déplacement terminé.
 */
export function CategoryManager({
  initial,
  universe,
}: {
  initial: CategoryRow[];
  universe: "VELOS" | "EQUIPEMENT";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function persistOrder(next: CategoryRow[]) {
    setRows(next);
    startTransition(async () => {
      const result = await reorderCategories(next.map((r) => r.id));
      if (!result.ok) setError(result.error ?? "Réorganisation impossible.");
    });
  }

  function remove(row: CategoryRow) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteCategory(row.id);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setRows((current) => current.filter((r) => r.id !== row.id));
      setFeedback(`Catégorie « ${row.name} » supprimée.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[12px] text-foreground-muted">
          Glissez une catégorie par sa poignée pour modifier l&apos;ordre
          d&apos;affichage sur le site.
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-full inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nouvelle catégorie
        </button>
      </div>

      {(creating || editing) && (
        <CategoryForm
          universe={universe}
          parents={rows}
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {rows.length === 0 ? (
        <p className="border border-dashed border-line p-10 text-center text-sm text-foreground-muted">
          Aucune catégorie dans cet univers.
        </p>
      ) : (
        <Reorder.Group
          axis="y"
          values={rows}
          onReorder={persistOrder}
          className="space-y-2"
        >
          {rows.map((row) => (
            <CategoryItem
              key={row.id}
              row={row}
              onEdit={() => {
                setEditing(row);
                setCreating(false);
              }}
              onDelete={() => remove(row)}
              disabled={pending}
            />
          ))}
        </Reorder.Group>
      )}

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="text-[12px] text-accent" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}

function CategoryItem({
  row,
  onEdit,
  onDelete,
  disabled,
}: {
  row: CategoryRow;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const controls = useDragControls();
  const [confirming, setConfirming] = useState(false);

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Déplacer « ${row.name} »`}
        className="cursor-grab touch-none text-foreground-muted transition-colors hover:text-accent active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {row.name}
          {!row.isActive && (
            <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
              masquée
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-foreground-muted">
          /{row.slug} · {row.productCount} produit
          {row.productCount > 1 ? "s" : ""}
        </p>
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[11px] text-foreground-muted">Supprimer ?</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onDelete();
              setConfirming(false);
            }}
            className="text-[11px] uppercase tracking-[0.14em] text-red-500"
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted"
          >
            Non
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Modifier « ${row.name} »`}
            className="grid h-9 w-9 place-items-center text-foreground-muted transition-colors hover:text-accent"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Supprimer « ${row.name} »`}
            className="grid h-9 w-9 place-items-center text-foreground-muted transition-colors hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}
    </Reorder.Item>
  );
}

function CategoryForm({
  universe,
  parents,
  initial,
  onClose,
  onSaved,
}: {
  universe: "VELOS" | "EQUIPEMENT";
  parents: CategoryRow[];
  initial: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    parentId: initial?.parentId ?? "",
    isActive: initial?.isActive ?? true,
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveCategory({
        id: initial?.id,
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        universe,
        imageUrl: form.imageUrl,
        parentId: form.parentId || null,
        isActive: form.isActive,
      });
      if (!result.ok) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSaved();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-accent/50 bg-surface p-6"
    >
      <h3 className="eyebrow">
        {initial ? `Modifier « ${initial.name} »` : "Nouvelle catégorie"}
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Nom *</span>
          <input
            value={form.name}
            required
            maxLength={120}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: initial ? f.slug : slugify(name),
              }));
            }}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Adresse (slug)</span>
          <input
            value={form.slug}
            maxLength={120}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
            }
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Catégorie parente</span>
          <select
            value={form.parentId}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
          >
            <option value="">Aucune</option>
            {parents
              .filter((p) => p.id !== initial?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>

        <label className="block">
          <span className="eyebrow">Image</span>
          <input
            value={form.imageUrl}
            maxLength={600}
            placeholder="https://…"
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 font-mono text-[12px] outline-none focus:border-accent"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="eyebrow">Description</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[12px] text-foreground-muted">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-3.5 w-3.5 accent-[var(--accent)]"
        />
        Visible sur le site
      </label>

      {error && (
        <p className="mt-4 text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden />
          )}
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
    </form>
  );
}
