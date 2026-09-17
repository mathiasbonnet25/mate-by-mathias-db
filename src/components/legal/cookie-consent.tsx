"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CATEGORY_LABELS,
  CONSENT_COOKIE,
  COOKIE_POLICY_VERSION,
  DEFAULT_CHOICES,
  acceptAll,
  parseConsentCookie,
  rejectAll,
  serializeConsent,
  type ConsentCategory,
  type ConsentChoices,
  type ConsentState,
} from "@/lib/consent";

type ConsentContextValue = {
  choices: ConsentChoices;
  hasDecided: boolean;
  openPreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue>({
  choices: DEFAULT_CHOICES,
  hasDecided: false,
  openPreferences: () => {},
});

export function useConsent() {
  return useContext(ConsentContext);
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConsentState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>(DEFAULT_CHOICES);

  useEffect(() => {
    const existing = parseConsentCookie(readCookie(CONSENT_COOKIE));
    setState(existing);
    if (existing) setDraft(existing.choices);
    setHydrated(true);
  }, []);

  const persist = useCallback(
    async (choices: ConsentChoices, origin: "BANNER" | "PREFERENCES" | "WITHDRAWAL") => {
      const next: ConsentState = {
        id: state?.id ?? crypto.randomUUID(),
        version: COOKIE_POLICY_VERSION,
        date: new Date().toISOString(),
        choices,
      };

      // Cookie de préférences : strictement nécessaire, donc déposé sans
      // consentement préalable, mais limité à la seule mémorisation du choix.
      const maxAge = 60 * 60 * 24 * 182;
      document.cookie = `${CONSENT_COOKIE}=${serializeConsent(next)}; path=/; max-age=${maxAge}; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;

      setState(next);
      setPanelOpen(false);

      // Preuve de consentement conservée côté serveur (sans IP en clair).
      try {
        await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consentId: next.id,
            choices,
            policyVersion: COOKIE_POLICY_VERSION,
            origin,
          }),
        });
      } catch {
        // L'enregistrement de la preuve ne doit pas bloquer la navigation :
        // le choix local fait foi immédiatement.
      }
    },
    [state?.id],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      choices: state?.choices ?? DEFAULT_CHOICES,
      hasDecided: Boolean(state),
      openPreferences: () => {
        setDraft(state?.choices ?? DEFAULT_CHOICES);
        setPanelOpen(true);
      },
    }),
    [state],
  );

  const showBanner = hydrated && !state && !panelOpen;

  return (
    <ConsentContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-banner-title"
            className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface-elevated/95 backdrop-blur-xl"
          >
            <div className="container-page flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2
                  id="cookie-banner-title"
                  className="font-display text-xl"
                >
                  Votre choix sur les cookies
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  Nous utilisons des cookies nécessaires au fonctionnement du
                  site. Avec votre accord, nous en utilisons également pour
                  mesurer l&apos;audience, afficher des contenus externes et
                  personnaliser nos communications. Vous pouvez refuser ou
                  modifier votre choix à tout moment.{" "}
                  <Link href="/cookies" className="underline hover:text-accent">
                    En savoir plus
                  </Link>
                  .
                </p>
              </div>

              {/* Accepter et refuser sont présentés au même niveau : même
                  taille, même poids visuel, un seul clic dans les deux cas. */}
              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <button
                  type="button"
                  onClick={() => persist(rejectAll(), "BANNER")}
                  className="h-11 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
                >
                  Tout refuser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // À ce stade aucun choix n'a été enregistré : on part
                    // du réglage le plus protecteur.
                    setDraft(DEFAULT_CHOICES);
                    setPanelOpen(true);
                  }}
                  className="h-11 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
                >
                  Personnaliser
                </button>
                <button
                  type="button"
                  onClick={() => persist(acceptAll(), "BANNER")}
                  className="rounded-full h-11 bg-accent px-6 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-all hover:brightness-110"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-end bg-[var(--overlay)] sm:place-items-center"
            onClick={() => setPanelOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-panel-title"
              className="max-h-[88vh] w-full overflow-y-auto rounded-lg border border-line bg-surface p-7 sm:max-w-2xl"
            >
              <h2 id="cookie-panel-title" className="font-display text-2xl">
                Préférences de cookies
              </h2>
              <p className="mt-2 text-sm text-foreground-muted">
                Choisissez les catégories que vous autorisez. Aucun traceur
                soumis à consentement n&apos;est déposé tant que vous
                n&apos;avez pas validé.
              </p>

              <div className="mt-7 space-y-4">
                {(Object.keys(CATEGORY_LABELS) as ConsentCategory[]).map(
                  (key) => {
                    const meta = CATEGORY_LABELS[key];
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-line p-5 transition-colors hover:border-accent/40"
                      >
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <h3 className="text-sm font-medium">{meta.name}</h3>
                            <p className="mt-2 text-[13px] leading-relaxed text-foreground-muted">
                              {meta.description}
                            </p>
                          </div>
                          <label className="mt-1 flex shrink-0 items-center gap-2">
                            <span className="sr-only">
                              Autoriser « {meta.name} »
                            </span>
                            <input
                              type="checkbox"
                              disabled={meta.essential}
                              checked={meta.essential || draft[key]}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  [key]: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-[var(--accent)] disabled:opacity-50"
                            />
                          </label>
                        </div>
                        {meta.essential && (
                          <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-accent">
                            Toujours actif
                          </p>
                        )}
                      </div>
                    );
                  },
                )}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => persist(rejectAll(), "PREFERENCES")}
                  className="h-11 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
                >
                  Tout refuser
                </button>
                <button
                  type="button"
                  onClick={() => persist(draft, "PREFERENCES")}
                  className="h-11 rounded-full border border-line px-6 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
                >
                  Enregistrer mes choix
                </button>
                <button
                  type="button"
                  onClick={() => persist(acceptAll(), "PREFERENCES")}
                  className="rounded-full h-11 bg-accent px-6 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-all hover:brightness-110"
                >
                  Tout accepter
                </button>
              </div>

              <p className="mt-5 text-[11px] text-foreground-muted">
                Politique de cookies version {COOKIE_POLICY_VERSION}. Votre
                choix est conservé 6 mois, puis vous sera redemandé.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConsentContext.Provider>
  );
}

/** Lien de retrait du consentement, placé dans le pied de page. */
export function CookiePreferencesButton({ className }: { className?: string }) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      Préférences de cookies
    </button>
  );
}
