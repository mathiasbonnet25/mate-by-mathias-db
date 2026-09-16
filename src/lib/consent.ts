/**
 * Modèle de consentement aux traceurs.
 *
 * Règles appliquées :
 *  - aucun traceur non nécessaire n'est déposé avant un acte positif ;
 *  - refuser est aussi simple qu'accepter (un seul clic, même niveau) ;
 *  - le choix est révocable à tout moment depuis le pied de page ;
 *  - une preuve horodatée est conservée côté serveur.
 */

/** À incrémenter à chaque évolution de la politique de cookies. */
export const COOKIE_POLICY_VERSION = "2026-01";

/** Le choix est redemandé au bout de 6 mois (recommandation CNIL). */
export const CONSENT_MAX_AGE_DAYS = 182;

export const CONSENT_COOKIE = "mbm-consent";

export type ConsentCategory = "necessary" | "analytics" | "marketing" | "media";

export type ConsentChoices = Record<ConsentCategory, boolean>;

export type ConsentState = {
  id: string;
  version: string;
  date: string;
  choices: ConsentChoices;
};

export const DEFAULT_CHOICES: ConsentChoices = {
  // Strictement nécessaire : panier, session, sécurité. Hors consentement.
  necessary: true,
  analytics: false,
  marketing: false,
  media: false,
};

export const CATEGORY_LABELS: Record<
  ConsentCategory,
  { name: string; description: string; essential: boolean }
> = {
  necessary: {
    name: "Strictement nécessaires",
    description:
      "Indispensables au fonctionnement du site : panier, connexion à votre compte, sécurité des formulaires et mémorisation de vos choix de cookies. Ils ne peuvent pas être désactivés et ne servent à aucun suivi publicitaire.",
    essential: true,
  },
  analytics: {
    name: "Mesure d'audience",
    description:
      "Nous aident à comprendre quelles pages sont consultées afin d'améliorer le site. Les statistiques sont agrégées et ne permettent pas de vous identifier.",
    essential: false,
  },
  marketing: {
    name: "Personnalisation et publicité",
    description:
      "Permettent de mesurer l'efficacité de nos campagnes et de vous proposer des contenus adaptés sur d'autres sites. Peuvent impliquer un partage avec des partenaires.",
    essential: false,
  },
  media: {
    name: "Contenus externes",
    description:
      "Vidéos, galerie Instagram et cartes intégrées. Ces services déposent leurs propres traceurs lorsqu'ils sont chargés.",
    essential: false,
  },
};

export function acceptAll(): ConsentChoices {
  return { necessary: true, analytics: true, marketing: true, media: true };
}

export function rejectAll(): ConsentChoices {
  return { ...DEFAULT_CHOICES };
}

export function parseConsentCookie(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    if (!parsed?.choices || parsed.version !== COOKIE_POLICY_VERSION) {
      // Politique modifiée : le consentement précédent ne vaut plus.
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}
