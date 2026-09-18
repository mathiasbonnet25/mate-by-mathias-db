/**
 * Prépare la base de données pendant le déploiement.
 *
 * Les migrations tournent ici parce que c'est le seul endroit qui joigne à
 * la fois le dépôt et la base. Le semis, lui, ne tourne que sur demande
 * explicite : sans cela, un produit de démonstration supprimé depuis
 * l'administration reviendrait à chaque mise en ligne.
 *
 * Appelé par « npm run build:deploiement », que l'hébergeur exécute.
 */
import { spawnSync } from "node:child_process";

/**
 * Noms sous lesquels l'adresse peut arriver, par ordre de préférence.
 * Netlify pose les variantes NETLIFY_ de lui-même quand la base a été créée
 * depuis son interface. Cette liste doit rester en accord avec
 * src/lib/database-url.ts, qui fait la même résolution pour l'application.
 */
const SOURCES = {
  DATABASE_URL: ["DATABASE_URL", "NETLIFY_DATABASE_URL"],
  // Faute d'adresse directe, on reprend celle de l'application : c'est le
  // repli de Prisma lui-même, et il fonctionne.
  DIRECT_URL: ["DIRECT_URL", "NETLIFY_DATABASE_URL_UNPOOLED"],
};

const SCHEMA_ATTENDU = /^postgres(ql)?:\/\//;

/**
 * Une adresse locale ne désigne rien sur un serveur de déploiement : la
 * machine qui construit le site n'héberge pas la base. Ces adresses ne
 * sont pas refusées pour autant — en développement c'est la bonne — mais
 * elles passent en dernier, derrière toute adresse distante.
 */
const HOTE_LOCAL = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/;

/** Vrai lorsque le script tourne dans la construction d'un hébergeur. */
const CHEZ_UN_HEBERGEUR = Boolean(process.env.NETLIFY || process.env.VERCEL);

/** Aperçu d'une valeur, mot de passe retiré : ces lignes finissent dans un journal. */
function apercu(valeur) {
  const sansMotDePasse = valeur.replace(/(:\/\/[^:@\s]*):[^@\s]*@/, "$1:…@");
  const court = sansMotDePasse.slice(0, 40);
  return court + (sansMotDePasse.length > 40 ? "…" : "");
}

/**
 * Cherche une adresse valable parmi les noms donnés.
 * Renvoie la valeur et son origine, ou le détail du premier refus — c'est
 * lui qui permet de dire à l'utilisateur quoi corriger, et où.
 */
function resoudre(noms) {
  const refus = [];
  /** Adresse locale retenue faute de mieux, examinée une fois le tour fini. */
  let repli;

  for (const nom of noms) {
    const brut = process.env[nom];
    if (brut === undefined) continue;
    const valeur = brut.trim();
    if (!valeur) {
      refus.push(`${nom} est vide`);
      continue;
    }
    if (!SCHEMA_ATTENDU.test(valeur)) {
      refus.push(`${nom} commence par « ${apercu(valeur)} »`);
      continue;
    }
    if (HOTE_LOCAL.test(valeur)) {
      repli ??= { valeur, nom };
      continue;
    }
    return { valeur, nom, refus };
  }

  if (repli) {
    refus.push(`${repli.nom} désigne une machine locale (${apercu(repli.valeur)})`);
    if (!CHEZ_UN_HEBERGEUR) return { ...repli, refus, local: true };
  }
  return { valeur: undefined, nom: undefined, refus, local: Boolean(repli) };
}

function expliquerRefus(refus, local) {
  if (refus.length === 0) return [];
  return [
    "Ce qui a été trouvé :",
    ...refus.map((r) => `  · ${r}`),
    "",
    ...(local
      ? [
          "Une adresse en « localhost » désigne la machine qui construit le",
          "site, et celle-ci n'héberge aucune base : c'est la valeur",
          "d'exemple du fichier modèle, restée telle quelle.",
          "",
          "Remplacez-la par l'adresse réelle de votre base, ou laissez",
          "Netlify la fournir (Project configuration → Database).",
        ]
      : [
          "Une adresse valable commence par postgresql:// — sans guillemets,",
          "sans « psql » devant, et sans le nom de la variable répété dans",
          "la valeur.",
        ]),
  ];
}

// --- Adresse de l'application : indispensable. ---
const app = resoudre(SOURCES.DATABASE_URL);

if (!app.valeur) {
  console.error(
    [
      "",
      "Aucune adresse de base de données utilisable.",
      "",
      ...expliquerRefus(app.refus, app.local),
      ...(app.refus.length === 0
        ? [
            "Aucune des variables DATABASE_URL ou NETLIFY_DATABASE_URL",
            "n'est définie.",
          ]
        : []),
      "",
      "Le plus simple, sur Netlify : Project configuration → Database,",
      "puis créer la base. La variable est alors renseignée toute seule.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

process.env.DATABASE_URL = app.valeur;
console.log(`→ Adresse de l'application : ${app.nom} (${apercu(app.valeur)})`);

// --- Adresse directe : un confort, jamais un obstacle. ---
//
// Elle sert aux migrations, que le mutualiseur de connexions gère mal.
// Mais une valeur erronée ici faisait échouer tout le déploiement avec un
// message qui ne nommait même pas la variable fautive. Puisque Prisma
// retombe sur DATABASE_URL quand elle est absente, autant l'écarter et
// continuer : mieux vaut un déploiement qui aboutit qu'une migration
// théoriquement mieux branchée.
const direct = resoudre(SOURCES.DIRECT_URL);

if (direct.valeur) {
  process.env.DIRECT_URL = direct.valeur;
  console.log(`→ Adresse des migrations : ${direct.nom}`);
} else {
  // On recopie l'adresse de l'application plutôt que de retirer la
  // variable : le schéma la réclame par « env("DIRECT_URL") », et Prisma
  // refuse de démarrer si elle manque — P1012. Le repli silencieux qu'on
  // croyait obtenir en la supprimant n'existait que grâce au fichier .env
  // d'un poste de développement ; un serveur de déploiement n'en a pas.
  process.env.DIRECT_URL = app.valeur;
  for (const r of direct.refus) console.log(`  · écartée : ${r}`);
  console.log(
    `→ Adresse des migrations : aucune de propre, on reprend ${app.nom}.`,
  );
}

function lancer(commande, arguments_) {
  const resultat = spawnSync(commande, arguments_, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (resultat.status !== 0) process.exit(resultat.status ?? 1);
}

console.log("→ Application des migrations…");
lancer("npx", ["prisma", "migrate", "deploy"]);

if (process.env.SEED_ON_DEPLOY === "1") {
  // Le semis passe par le client Prisma, qui n'existe pas tant qu'il n'a
  // pas été engendré : il n'est pas versionné, et un serveur de
  // déploiement part d'un dossier propre. « npm run build » s'en charge
  // aussi, mais plus tard — trop tard pour cette étape-ci.
  console.log("→ Génération du client Prisma…");
  lancer("npx", ["prisma", "generate"]);

  console.log("→ Données de départ (SEED_ON_DEPLOY=1)…");
  lancer("npx", ["tsx", "prisma/seed.ts"]);
  console.log("→ Pensez à retirer SEED_ON_DEPLOY une fois la base peuplée.");
} else {
  console.log("→ Semis ignoré (SEED_ON_DEPLOY absent).");
}

console.log("→ Base prête.");
