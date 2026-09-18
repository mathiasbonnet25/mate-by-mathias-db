/**
 * Prépare la base de données pendant le déploiement.
 *
 * Le conteneur de développement ne peut pas joindre la base de production ;
 * l'environnement de construction de l'hébergeur, lui, le peut. Ce script
 * y applique donc les migrations, et sème les données de départ lorsqu'on
 * le lui demande explicitement.
 *
 * Il est appelé par « npm run build:deploiement », que l'hébergeur exécute.
 *
 * Deux garde-fous :
 *  - sans DATABASE_URL, on arrête tout de suite avec un message lisible,
 *    plutôt que de laisser Prisma échouer trois écrans plus loin ;
 *  - le semis ne tourne que si SEED_ON_DEPLOY vaut « 1 ». Sans cela, un
 *    produit de démonstration supprimé depuis l'administration
 *    réapparaîtrait à chaque mise en ligne.
 */
import { spawnSync } from "node:child_process";

/**
 * Les commandes Prisma lancées en ligne de commande ne lisent que le
 * schéma, donc DATABASE_URL et DIRECT_URL. Quand la base a été créée
 * depuis l'interface de l'hébergeur, celui-ci renseigne des variables à
 * lui : on les recopie ici sous les noms attendus.
 *
 * Cette liste doit rester en accord avec src/lib/database-url.ts, qui fait
 * la même résolution pour l'application elle-même.
 */
const CORRESPONDANCES = [
  ["DATABASE_URL", ["NETLIFY_DATABASE_URL"]],
  ["DIRECT_URL", ["NETLIFY_DATABASE_URL_UNPOOLED", "NETLIFY_DATABASE_URL"]],
];

for (const [attendue, secours] of CORRESPONDANCES) {
  if (process.env[attendue]?.trim()) continue;
  const trouvee = secours.find((nom) => process.env[nom]?.trim());
  if (trouvee) {
    process.env[attendue] = process.env[trouvee];
    console.log(`→ ${attendue} reprise de ${trouvee}.`);
  }
}

function lancer(commande, arguments_) {
  const resultat = spawnSync(commande, arguments_, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (resultat.status !== 0) {
    process.exit(resultat.status ?? 1);
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    [
      "",
      "Aucune base de données n'est configurée.",
      "",
      "Le site ne peut pas fonctionner sans elle : les pages catalogue et",
      "l'atelier de personnalisation renverraient une erreur.",
      "",
      "Le plus simple, sur Netlify : Project configuration → Database,",
      "puis créer la base. La variable de connexion est alors renseignée",
      "toute seule, il n'y a rien à recopier.",
      "",
      "Sinon, renseignez DATABASE_URL à la main. La valeur doit commencer",
      "par postgresql:// — sans guillemets, sans « psql » devant, et sans",
      "le nom de la variable répété dans la valeur.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL.trim())) {
  const debut = process.env.DATABASE_URL.trim().slice(0, 24);
  console.error(
    [
      "",
      "L'adresse de la base ne ressemble pas à une adresse PostgreSQL.",
      "",
      `Elle commence par : ${debut}…`,
      "Elle devrait commencer par : postgresql://",
      "",
      "Les confusions les plus fréquentes : avoir copié la ligne de",
      "commande entière (« psql '...' »), avoir gardé « DATABASE_URL= »",
      "au début de la valeur, ou avoir laissé les guillemets.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("→ Application des migrations…");
lancer("npx", ["prisma", "migrate", "deploy"]);

if (process.env.SEED_ON_DEPLOY === "1") {
  console.log("→ Données de départ (SEED_ON_DEPLOY=1)…");
  lancer("npx", ["tsx", "prisma/seed.ts"]);
  console.log(
    "→ Pensez à retirer SEED_ON_DEPLOY une fois la base peuplée.",
  );
} else {
  console.log("→ Semis ignoré (SEED_ON_DEPLOY absent).");
}

console.log("→ Base prête.");
