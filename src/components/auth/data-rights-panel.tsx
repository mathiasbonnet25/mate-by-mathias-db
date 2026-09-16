"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";

import { exportMyData, requestAccountDeletion } from "@/app/actions/account";

/**
 * Exercice des droits RGPD depuis l'espace client : accès, portabilité et
 * effacement, sans avoir à écrire un courriel.
 */
export function DataRightsPanel() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleted, setDeleted] = useState(false);

  function download() {
    setError(null);
    startTransition(async () => {
      const result = await exportMyData();
      if (!result.ok || !result.data) {
        setError(result.error ?? "Export impossible.");
        return;
      }
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mate-by-mathias-mes-donnees-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function remove(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestAccountDeletion({ password });
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setDeleted(true);
      // La session porte encore l'ancien compte : on repart de l'accueil.
      setTimeout(() => {
        window.location.href = "/api/auth/signout";
      }, 4000);
    });
  }

  if (deleted) {
    return (
      <div className="border border-line p-8">
        <h3 className="font-display text-2xl">Compte supprimé</h3>
        <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
          Vos données identifiantes ont été effacées. Vos factures sont
          conservées dix ans, comme la loi comptable l&apos;impose, mais ne
          sont plus rattachées à un compte actif. Vous allez être déconnecté.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="border border-line p-7">
        <h3 className="font-display text-xl">
          Accès et portabilité de mes données
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          Téléchargez l&apos;ensemble des données associées à votre compte dans
          un format structuré et réutilisable : profil, adresses, commandes,
          factures, devis, favoris et avis.
        </p>
        <button
          type="button"
          onClick={download}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 border border-line px-6 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden />
          )}
          Télécharger mes données
        </button>
      </section>

      <section className="border border-line p-7">
        <h3 className="font-display text-xl">Effacement de mon compte</h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          Vos données identifiantes sont effacées immédiatement et
          définitivement. Les factures émises restent conservées dix ans au
          titre de l&apos;obligation comptable (art. L123-22 du code de
          commerce), sous une forme dissociée de votre identité en ligne.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-6 inline-flex items-center gap-2 border border-line px-6 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-red-500 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Supprimer mon compte
          </button>
        ) : (
          <form onSubmit={remove} className="mt-6 max-w-sm">
            <label className="block">
              <span className="eyebrow">Confirmez votre mot de passe</span>
              <input
                type="password"
                value={password}
                required
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-3 h-12 w-full border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
              />
            </label>

            {error && (
              <p className="mt-3 text-[12px] text-red-500" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={pending || !password}
                className="inline-flex items-center gap-2 border border-red-500 px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
              >
                {pending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                )}
                Confirmer la suppression
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                }}
                className="px-3 text-[11px] uppercase tracking-[0.16em] text-foreground-muted hover:text-accent"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
