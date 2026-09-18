/**
 * Adresse de connexion à la base.
 *
 * Deux façons de la fournir, dans cet ordre :
 *
 *  1. DATABASE_URL, que l'on renseigne soi-même — le cas d'un poste de
 *     développement, ou d'un hébergeur de base choisi à la main ;
 *  2. NETLIFY_DATABASE_URL, que Netlify écrit tout seul lorsque la base a
 *     été créée depuis son interface. Rien à recopier, donc rien à se
 *     tromper en recopiant.
 *
 * La seconde adresse, dite « directe », ne sert qu'aux migrations : le
 * mutualiseur de connexions ne gère pas les verrous dont le moteur de
 * migration a besoin. À défaut, on retombe sur la première, ce qui
 * fonctionne dans la plupart des cas.
 *
 * Ces noms apparaissent à un seul autre endroit, scripts/preparer-base.mjs,
 * qui les traduit en DATABASE_URL pour les commandes Prisma lancées en
 * ligne de commande — elles ne lisent que le schéma. Les deux listes
 * doivent rester en accord.
 */

/** Renvoie la première variable renseignée, en ignorant les valeurs vides. */
function premiereRenseignee(...noms: string[]): string | undefined {
  for (const nom of noms) {
    const valeur = process.env[nom]?.trim();
    if (valeur) return valeur;
  }
  return undefined;
}

/** Connexion de l'application. Mutualisée en production. */
export function databaseUrl(): string | undefined {
  return premiereRenseignee("DATABASE_URL", "NETLIFY_DATABASE_URL");
}

/** Connexion directe, réservée aux migrations. */
export function directDatabaseUrl(): string | undefined {
  return premiereRenseignee(
    "DIRECT_URL",
    "NETLIFY_DATABASE_URL_UNPOOLED",
    "DATABASE_URL",
    "NETLIFY_DATABASE_URL",
  );
}

/**
 * Message affiché quand aucune adresse n'est disponible. Il s'adresse à
 * quelqu'un qui administre le site, pas à un développeur : il dit quoi
 * faire, pas ce qui a échoué.
 */
export const MESSAGE_SANS_BASE = [
  "Aucune base de données n'est configurée.",
  "",
  "Sur Netlify : Project configuration → Database → créer la base.",
  "La variable de connexion est alors renseignée automatiquement.",
  "",
  "Ailleurs : renseignez DATABASE_URL avec une adresse commençant par",
  "postgresql://",
].join("\n");
