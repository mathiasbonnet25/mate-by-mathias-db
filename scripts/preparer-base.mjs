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
  DIRECT_URL: [
    "DIRECT_URL",
    "NETLIFY_DATABASE_URL_UNPOOLED",
    "DATABASE_URL",
    "NETLIFY_DATABASE_URL",
  ],
};

const SCHEMA_ATTENDU = /^postgres(ql)?:\/\//;

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
    return { valeur, nom, refus };
  }
  return { valeur: undefined, nom: undefined, refus };
}

function expliquerRefus(refus) {
  if (refus.length === 0) return [];
  return [
    "Ce qui a été trouvé :",
    ...refus.map((r) => `  · ${r}`),
    "",
    "Une adresse valable commence par postgresql:// — sans guillemets,",
    "sans « psql » devant, et sans le nom de la variable répété dans la",
    "valeur.",
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
      ...expliquerRefus(app.refus),
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
  delete process.env.DIRECT_URL;
  console.log("→ Adresse des migrations : aucune, on reprend la précédente.");
  for (const r of direct.refus) console.log(`  · écartée : ${r}`);
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
  console.log("→ Données de départ (SEED_ON_DEPLOY=1)…");
  lancer("npx", ["tsx", "prisma/seed.ts"]);
  console.log("→ Pensez à retirer SEED_ON_DEPLOY une fois la base peuplée.");
} else {
  console.log("→ Semis ignoré (SEED_ON_DEPLOY absent).");
}

console.log("→ Base prête.");
