"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { changePassword } from "@/app/actions/account";

export function PasswordChangeForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = await changePassword(form);
      if (!result.ok) {
        setError(result.error ?? "Modification impossible.");
        return;
      }
      setDone(true);
      setForm({ current: "", next: "", confirm: "" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-5 border border-line p-7">
      <Field
        label="Mot de passe actuel"
        value={form.current}
        onChange={(v) => setForm((f) => ({ ...f, current: v }))}
        autoComplete="current-password"
      />
      <Field
        label="Nouveau mot de passe"
        value={form.next}
        onChange={(v) => setForm((f) => ({ ...f, next: v }))}
        autoComplete="new-password"
      />
      <Field
        label="Confirmer"
        value={form.confirm}
        onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
        autoComplete="new-password"
      />

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="flex items-center gap-2 text-[12px] text-accent" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Mot de passe modifié.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-foreground px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-surface transition-all hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        Modifier
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type="password"
        value={value}
        required
        autoComplete={autoComplete}
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}
