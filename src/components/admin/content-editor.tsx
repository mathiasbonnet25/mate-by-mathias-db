"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Eye, Loader2 } from "lucide-react";

import { saveContentBlocks } from "@/app/actions/admin-content";

export type ContentField = {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  value: string;
  draftValue: string | null;
};

export type ContentGroup = {
  title: string;
  description?: string;
  fields: ContentField[];
};

/**
 * Édition du contenu du site sans toucher au code.
 *
 * Deux boutons distincts : « enregistrer en brouillon » alimente l'aperçu
 * responsive, « publier » met le texte en ligne. Le brouillon n'est jamais
 * visible du public.
 */
export function ContentEditor({ groups }: { groups: ContentGroup[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      groups.flatMap((g) =>
        g.fields.map((f) => [f.key, f.draftValue ?? f.value]),
      ),
    ),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save(publish: boolean) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await saveContentBlocks({
        blocks: Object.entries(values).map(([key, value]) => ({
          key,
          value,
          asDraft: !publish,
        })),
        publish,
      });
      if (!result.ok) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      setFeedback(
        publish
          ? "Contenu publié. Il est désormais visible sur le site."
          : "Brouillon enregistré. Vérifiez-le dans l'aperçu avant publication.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.title} className="card-soft p-6">
          <h2 className="eyebrow">{group.title}</h2>
          {group.description && (
            <p className="mt-2 text-[12px] text-foreground-muted">
              {group.description}
            </p>
          )}

          <div className="mt-6 space-y-5">
            {group.fields.map((field) => (
              <label key={field.key} className="block">
                <span className="text-[12px]">{field.label}</span>
                {field.multiline ? (
                  <textarea
                    rows={5}
                    maxLength={20_000}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    className="mt-2 w-full rounded-sm border border-line bg-transparent p-3 text-sm outline-none focus:border-accent"
                  />
                ) : (
                  <input
                    maxLength={2000}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
                  />
                )}
                <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                  <code className="font-mono">{field.key}</code>
                  {field.hint && <span>· {field.hint}</span>}
                  {field.draftValue != null && field.draftValue !== "" && (
                    <span className="text-accent">· brouillon non publié</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="flex items-center gap-2 text-[12px] text-accent" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {feedback}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center gap-3 border-t border-line bg-surface px-6 py-4 lg:-mx-10 lg:px-10">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Enregistrer en brouillon
        </button>

        <Link
          href="/admin/apercu"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          Aperçu responsive
        </Link>

        <button
          type="button"
          onClick={() => save(true)}
          disabled={pending}
          className="rounded-full inline-flex h-11 items-center gap-2 bg-accent px-6 text-[11px] uppercase tracking-[0.16em] text-accent-contrast transition-all hover:brightness-110 disabled:opacity-50"
        >
          Publier
        </button>
      </div>
    </div>
  );
}
