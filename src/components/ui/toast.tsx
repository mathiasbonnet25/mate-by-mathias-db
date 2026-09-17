"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, AlertCircle } from "lucide-react";

/**
 * Notifications éphémères.
 *
 * Le site n'en avait aucune : ajouter un article au panier ne produisait
 * qu'un chiffre qui changeait dans un coin de l'écran, ce qui passait
 * inaperçu. Une notification confirme l'action à l'endroit où l'œil se
 * trouve déjà.
 *
 * Écrit à la main plutôt qu'emprunté à une bibliothèque : le besoin tient
 * en une centaine de lignes, et chaque dépendance ajoutée pèse sur le
 * chemin critique de toutes les pages.
 *
 * Accessibilité : la zone est une région « polie », annoncée par les
 * lecteurs d'écran sans interrompre la lecture en cours.
 */

type Ton = "succes" | "erreur";

type Notification = {
  id: number;
  ton: Ton;
  titre: string;
  detail?: string;
  /** Visuel facultatif, par exemple la photo du produit ajouté. */
  imageUrl?: string | null;
};

type ToastContextValue = {
  notifier: (n: Omit<Notification, "id">) => void;
};

const ToastContext = createContext<ToastContextValue>({ notifier: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const DUREE_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const compteur = useRef(0);
  const minuteries = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const retirer = useCallback((id: number) => {
    setNotifications((liste) => liste.filter((n) => n.id !== id));
    const t = minuteries.current.get(id);
    if (t) {
      clearTimeout(t);
      minuteries.current.delete(id);
    }
  }, []);

  const notifier = useCallback(
    (n: Omit<Notification, "id">) => {
      const id = ++compteur.current;
      // Au-delà de trois, la pile masque le contenu : on écarte la plus
      // ancienne plutôt que d'empiler indéfiniment.
      setNotifications((liste) => [...liste.slice(-2), { ...n, id }]);
      minuteries.current.set(
        id,
        setTimeout(() => retirer(id), DUREE_MS),
      );
    },
    [retirer],
  );

  // Les minuteries en cours sont annulées au démontage, pour ne pas
  // écrire dans un composant qui n'existe plus.
  useEffect(() => {
    const encours = minuteries.current;
    return () => {
      encours.forEach((t) => clearTimeout(t));
      encours.clear();
    };
  }, []);

  const value = useMemo(() => ({ notifier }), [notifier]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex flex-col items-center gap-3 px-4 pb-6 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface-elevated/95 p-4 shadow-[var(--shadow-lifted)] backdrop-blur-xl"
            >
              {n.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-sm object-cover"
                />
              ) : (
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    n.ton === "succes"
                      ? "bg-accent/12 text-accent"
                      : "bg-red-500/12 text-red-500"
                  }`}
                  aria-hidden
                >
                  {n.ton === "succes" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug">{n.titre}</p>
                {n.detail && (
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
                    {n.detail}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => retirer(n.id)}
                aria-label="Fermer la notification"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
