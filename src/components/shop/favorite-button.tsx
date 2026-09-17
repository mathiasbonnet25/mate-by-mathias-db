"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { toggleFavorite } from "@/app/actions/account";
import { useToast } from "@/components/ui/toast";

/**
 * Bouton favori.
 *
 * L'action et la page « Mes favoris » existaient déjà, mais rien ne
 * permettait d'ajouter un favori : la fonctionnalité tournait à vide.
 *
 * Un visiteur non connecté n'est pas renvoyé brutalement vers la page de
 * connexion — il perdrait sa fiche produit. Une notification lui explique
 * ce qui manque et lui laisse le choix.
 *
 * L'état est chargé par une requête dédiée plutôt que calculé dans le
 * rendu de la fiche : celle-ci reste ainsi pré-rendue et servie depuis le
 * cache, au lieu d'être recalculée à chaque visite pour un seul cœur.
 */
export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const router = useRouter();
  const { notifier } = useToast();
  const [favori, setFavori] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const controleur = new AbortController();
    fetch(`/api/favoris?produit=${encodeURIComponent(productId)}`, {
      cache: "no-store",
      signal: controleur.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { signedIn?: boolean; favorite?: boolean } | null) => {
        if (!d) return;
        setConnecte(Boolean(d.signedIn));
        setFavori(Boolean(d.favorite));
      })
      .catch(() => {
        // Réseau indisponible : le bouton reste utilisable, il proposera
        // simplement de se connecter.
      });
    return () => controleur.abort();
  }, [productId]);

  function basculer() {
    if (!connecte) {
      notifier({
        ton: "erreur",
        titre: "Connectez-vous pour enregistrer un favori",
        detail: "Vos favoris sont rattachés à votre compte client.",
      });
      return;
    }

    // Bascule optimiste : le cœur répond au clic, l'état réel est
    // resynchronisé juste après.
    const cible = !favori;
    setFavori(cible);

    startTransition(async () => {
      const resultat = await toggleFavorite(productId);
      if (!resultat.ok) {
        setFavori(!cible);
        notifier({
          ton: "erreur",
          titre: "Enregistrement impossible",
          detail: resultat.error ?? undefined,
        });
        return;
      }
      notifier({
        ton: "succes",
        titre: cible ? "Ajouté à vos favoris" : "Retiré de vos favoris",
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={pending}
      aria-pressed={favori}
      aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={
        className ??
        "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line transition-all duration-400 hover:border-accent hover:text-accent active:scale-95 disabled:opacity-50"
      }
    >
      <motion.span
        key={String(favori)}
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        className="grid place-items-center"
      >
        <Heart
          className={`h-[18px] w-[18px] transition-colors ${
            favori ? "fill-accent text-accent" : ""
          }`}
          aria-hidden
        />
      </motion.span>
    </button>
  );
}
