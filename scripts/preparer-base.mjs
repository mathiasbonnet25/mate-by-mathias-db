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

function lancer(commande, arguments_) {
  const resultat = spawnSync(commande, arguments_, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (resultat.status !== 0) {
    process.exit(resultat.status ?? 1);
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    [
      "",
      "DATABASE_URL n'est pas définie.",
      "",
      "Le site ne peut pas fonctionner sans base de données : les pages",
      "catalogue et l'atelier de personnalisation renverraient une erreur.",
      "",
      "Renseignez la variable dans les réglages de l'hébergeur, rubrique",
      "variables d'environnement, puis relancez le déploiement.",
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
