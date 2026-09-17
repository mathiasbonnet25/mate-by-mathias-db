"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, ImagePlus, Loader2, X } from "lucide-react";

import { submitClaimAction } from "@/app/actions/claims";

/**
 * Dépôt d'une réclamation.
 *
 * Le formulaire est court à dessein : nom, contact, numéro de commande,
 * motif, description et photos. Tout ce qui peut être déduit côté atelier
 * n'est pas demandé au client, qui écrit rarement dans de bonnes
 * conditions — il est contrarié, parfois pressé.
 *
 * Les photos sont envoyées au fil de l'eau plutôt qu'à la validation :
 * une erreur de format se signale immédiatement, et non après avoir tout
 * ressaisi.
 */

const MOTIFS = [
  { value: "DAMAGED", label: "Produit endommagé à la réception" },
  { value: "NOT_CONFORM", label: "Produit non conforme à ma commande" },
  { value: "MISSING", label: "Article manquant dans le colis" },
  { value: "DELAY", label: "Retard de livraison" },
  { value: "QUALITY", label: "Défaut constaté à l'usage" },
  { value: "WITHDRAWAL", label: "Demande de rétractation" },
  { value: "OTHER", label: "Autre motif" },
] as const;

type PieceJointe = { url: string; fileName: string; mimeType: string };

const MAX_PIECES = 5;

export function ClaimForm({ defaultEmail }: { defaultEmail?: string | null }) {
  const inputFichier = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [numero, setNumero] = useState<string | null>(null);
  const [pieces, setPieces] = useState<PieceJointe[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: defaultEmail ?? "",
    phone: "",
    orderNumber: "",
    reason: "DAMAGED" as (typeof MOTIFS)[number]["value"],
    description: "",
    consent: false,
    website: "",
  });

  async function televerser(fichiers: FileList) {
    setErreur(null);
    setEnvoi(true);

    for (const fichier of Array.from(fichiers)) {
      if (pieces.length >= MAX_PIECES) {
        setErreur(`Cinq photos au maximum par dossier.`);
        break;
      }
      const body = new FormData();
      body.append("file", fichier);
      try {
        const res = await fetch("/api/reclamations/piece-jointe", {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Envoi refusé.");
        setPieces((p) => [...p, data as PieceJointe]);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Envoi impossible.");
        break;
      }
    }

    setEnvoi(false);
  }

  function soumettre(event: React.FormEvent) {
    event.preventDefault();
    setErreur(null);

    startTransition(async () => {
      const resultat = await submitClaimAction({ ...form, attachments: pieces });
      if (!resultat.ok) {
        setErreur(resultat.error ?? "L'envoi a échoué.");
        return;
      }
      setNumero(resultat.number ?? null);
    });
  }

  if (numero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-soft mx-auto max-w-2xl p-10 text-center md:p-12"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-accent text-accent">
          <Check className="h-6 w-6" aria-hidden />
        </span>

        <h2 className="mt-8 font-display text-3xl">Réclamation enregistrée</h2>

        <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
          Votre dossier porte le numéro{" "}
          <strong className="text-foreground">{numero}</strong>. Conservez-le :
          il nous permet de vous retrouver à chaque échange.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
          Un accusé de réception vient de vous être envoyé. Nous examinons
          votre demande et revenons vers vous sous quinze jours au plus tard.
          Vous pouvez répondre à ce courriel pour ajouter des documents.
        </p>

        <p className="mt-8 text-[12px] leading-relaxed text-foreground-muted">
          Vos données sont conservées le temps du traitement du dossier, puis
          pendant la durée de prescription applicable — voir la{" "}
          <Link href="/confidentialite" className="underline hover:text-accent">
            politique de confidentialité
          </Link>
          .
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={soumettre} className="card-soft p-7 md:p-10" noValidate>
      {/* Champ leurre, hors flux et hors tabulation. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="rec-website">Ne pas remplir</label>
        <input
          id="rec-website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Champ
          label="Prénom"
          requis
          value={form.firstName}
          onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
          autoComplete="given-name"
        />
        <Champ
          label="Nom"
          requis
          value={form.lastName}
          onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
          autoComplete="family-name"
        />
        <Champ
          label="Adresse électronique"
          type="email"
          requis
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          autoComplete="email"
        />
        <Champ
          label="Téléphone (facultatif)"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          autoComplete="tel"
        />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Champ
          label="Numéro de commande"
          value={form.orderNumber}
          onChange={(v) => setForm((f) => ({ ...f, orderNumber: v }))}
          aide="Figure sur votre confirmation de commande, au format MBM-2026-00042. Laissez vide si votre demande n'en concerne aucune."
        />

        <label className="block">
          <span className="eyebrow">
            Motif<span className="text-accent"> *</span>
          </span>
          <select
            value={form.reason}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                reason: e.target.value as typeof f.reason,
              }))
            }
            className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
          >
            {MOTIFS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-6 block">
        <span className="eyebrow">
          Description du problème<span className="text-accent"> *</span>
        </span>
        <textarea
          rows={7}
          required
          maxLength={5000}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Décrivez ce que vous avez constaté, à quel moment, et ce que vous souhaitez : réparation, remplacement, remboursement…"
          className="mt-3 w-full rounded-sm border border-line bg-transparent p-4 text-sm outline-none transition-colors focus:border-accent"
        />
      </label>

      {/* Photos */}
      <div className="mt-6">
        <span className="eyebrow">Photos (facultatif)</span>
        <p className="mt-2 text-[12px] leading-relaxed text-foreground-muted">
          Cinq photos au maximum, 8 Mo chacune, aux formats JPEG, PNG, WebP ou
          AVIF. Pour tout autre document, répondez à l&apos;accusé de réception
          que vous recevrez par courriel.
        </p>

        <input
          ref={inputFichier}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          /* Le champ est masqué et déclenché par le bouton voisin : il lui
             faut malgré tout un nom accessible, sinon il reste annoncé
             comme un champ sans étiquette. */
          aria-label="Ajouter des photos à votre réclamation"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) televerser(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {pieces.map((p, i) => (
            <span
              key={p.url}
              className="relative h-20 w-20 overflow-hidden rounded-sm border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`Pièce jointe ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setPieces((liste) => liste.filter((x) => x.url !== p.url))
                }
                aria-label={`Retirer la pièce jointe ${i + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-surface/90 text-foreground shadow-[var(--shadow-soft)] transition-colors hover:text-red-500"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}

          {pieces.length < MAX_PIECES && (
            <button
              type="button"
              onClick={() => inputFichier.current?.click()}
              disabled={envoi}
              className="grid h-20 w-20 place-items-center rounded-sm border border-dashed border-line text-foreground-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {envoi ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="h-5 w-5" aria-hidden />
              )}
              <span className="sr-only">Ajouter une photo</span>
            </button>
          )}
        </div>
      </div>

      <label className="mt-7 flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-foreground-muted">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          J&apos;accepte que mes données et les photos transmises soient
          utilisées pour traiter ma réclamation. Elles ne servent à rien
          d&apos;autre — voir la{" "}
          <Link href="/confidentialite" className="underline hover:text-accent">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      {erreur && (
        <p className="mt-5 text-[12px] text-red-500" role="alert">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || envoi}
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-10 text-[11px] uppercase tracking-[0.18em] text-surface shadow-[var(--shadow-soft)] transition-all duration-500 hover:bg-accent hover:text-accent-contrast hover:shadow-[var(--shadow-lifted)] active:scale-[0.97] disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Envoyer ma réclamation
      </button>
    </form>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
  requis = false,
  autoComplete,
  aide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  requis?: boolean;
  autoComplete?: string;
  aide?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">
        {label}
        {requis && <span className="text-accent"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={requis}
        autoComplete={autoComplete}
        maxLength={180}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full rounded-sm border border-line bg-transparent px-4 text-sm outline-none transition-colors focus:border-accent"
      />
      {aide && (
        <span className="mt-2 block text-[11px] leading-relaxed text-foreground-muted">
          {aide}
        </span>
      )}
    </label>
  );
}
