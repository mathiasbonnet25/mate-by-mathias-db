/**
 * Jeu de données initial.
 *
 * Il crée le strict nécessaire pour que le site soit utilisable dès la
 * première installation : catégories, tarifs de livraison, barème de
 * l'atelier, catégories de cookies, contenu éditorial et un compte
 * administrateur.
 *
 * Le mot de passe administrateur est lu dans SEED_ADMIN_PASSWORD. Aucun mot
 * de passe par défaut n'est codé en dur : un compte à identifiants connus
 * publiquement serait la première porte essayée sur un site en ligne.
 *
 * Usage : npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { DEFAULT_OPTIONS } from "../src/lib/customization-shared";
import { CONTENT_DEFAULTS } from "../src/lib/content-defaults";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "· Compte administrateur ignoré (SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD non définis).",
    );
    return;
  }
  if (password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD doit contenir au moins 12 caractères.",
    );
  }

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      name: "Administrateur",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      emailVerified: new Date(),
    },
    update: { role: "ADMIN" },
  });

  console.log(`· Compte administrateur : ${user.email}`);
  console.log(
    "  Activez la double authentification dès la première connexion, dans Mon compte → Sécurité.",
  );
}

async function seedCategories() {
  const categories = [
    { slug: "cadres", name: "Cadres", universe: "VELOS" as const },
    { slug: "velos-complets", name: "Vélos complets", universe: "VELOS" as const },
    { slug: "roues", name: "Roues", universe: "VELOS" as const },
    { slug: "composants", name: "Composants", universe: "VELOS" as const },
    { slug: "vetements", name: "Vêtements", universe: "EQUIPEMENT" as const },
    { slug: "casques", name: "Casques", universe: "EQUIPEMENT" as const },
    { slug: "chaussures", name: "Chaussures", universe: "EQUIPEMENT" as const },
    { slug: "lunettes", name: "Lunettes", universe: "EQUIPEMENT" as const },
    { slug: "gants", name: "Gants", universe: "EQUIPEMENT" as const },
    { slug: "sacs", name: "Sacs", universe: "EQUIPEMENT" as const },
    { slug: "accessoires", name: "Accessoires", universe: "EQUIPEMENT" as const },
  ];

  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, position: index },
      update: { name: category.name, universe: category.universe },
    });
  }

  console.log(`· ${categories.length} catégories`);
}

async function seedShipping() {
  const rates = [
    {
      name: "Colissimo suivi",
      zone: "FR",
      priceCents: 990,
      freeAboveCents: 15000,
      maxWeightGrams: 5000,
      deliveryEstimate: "2 à 4 jours ouvrés",
      position: 0,
    },
    {
      name: "Transporteur spécialisé (cadre ou vélo)",
      zone: "FR",
      priceCents: 3900,
      minWeightGrams: 5001,
      deliveryEstimate: "3 à 6 jours ouvrés",
      position: 1,
    },
    {
      name: "Union européenne",
      zone: "EU",
      priceCents: 2490,
      freeAboveCents: 40000,
      deliveryEstimate: "5 à 9 jours ouvrés",
      position: 2,
    },
  ];

  for (const rate of rates) {
    const existing = await prisma.shippingRate.findFirst({
      where: { name: rate.name, zone: rate.zone },
    });
    if (existing) {
      await prisma.shippingRate.update({ where: { id: existing.id }, data: rate });
    } else {
      await prisma.shippingRate.create({ data: rate });
    }
  }

  console.log(`· ${rates.length} tarifs de livraison`);
}

async function seedCustomization() {
  let count = 0;

  for (const [step, options] of Object.entries(DEFAULT_OPTIONS)) {
    for (const [position, option] of options.entries()) {
      const data = {
        step,
        slug: option.slug,
        label: option.label,
        description: option.description,
        priceCents: option.priceCents,
        priceMultiplier: option.priceMultiplier,
        isMultiple: option.isMultiple,
        position,
        isActive: true,
      };
      await prisma.customizationOption.upsert({
        where: { step_slug: { step, slug: option.slug } },
        create: data,
        update: data,
      });
      count += 1;
    }
  }

  console.log(`· ${count} options de personnalisation`);
}

async function seedCookies() {
  const categories = [
    {
      slug: "necessary",
      name: "Strictement nécessaires",
      description:
        "Indispensables au fonctionnement du site : panier, connexion, sécurité des formulaires et mémorisation du choix de cookies. Exemptés de consentement.",
      isEssential: true,
      position: 0,
      trackers: [
        {
          name: "mbm-cart",
          vendor: "Mate by Mathias",
          purpose: "Conserve le contenu du panier entre deux visites.",
          retention: "30 jours",
        },
        {
          name: "mbm.session",
          vendor: "Mate by Mathias",
          purpose: "Maintient la session d'un client connecté.",
          retention: "7 jours",
        },
        {
          name: "mbm-consent",
          vendor: "Mate by Mathias",
          purpose: "Mémorise votre choix en matière de cookies.",
          retention: "6 mois",
        },
        {
          name: "__stripe_mid",
          vendor: "Stripe",
          purpose:
            "Prévention de la fraude lors du paiement. Déposé uniquement au moment du règlement.",
          retention: "1 an",
          recipientCountry: "Irlande / États-Unis",
        },
      ],
    },
    {
      slug: "analytics",
      name: "Mesure d'audience",
      description:
        "Comptage des pages consultées afin d'améliorer le site. Statistiques agrégées, sans identification.",
      isEssential: false,
      position: 1,
      trackers: [
        {
          name: "Mesure interne",
          vendor: "Mate by Mathias",
          purpose:
            "Compte les visiteurs uniques quotidiens à partir d'un condensat salé renouvelé chaque jour. Aucun identifiant persistant.",
          retention: "13 mois",
        },
      ],
    },
    {
      slug: "media",
      name: "Contenus externes",
      description:
        "Galerie Instagram, vidéos et cartes intégrées. Ces services déposent leurs propres traceurs.",
      isEssential: false,
      position: 2,
      trackers: [
        {
          name: "Instagram",
          vendor: "Meta Platforms Ireland Ltd.",
          purpose: "Affichage de la galerie de publications de l'atelier.",
          retention: "Variable, voir la politique de Meta",
          recipientCountry: "Irlande / États-Unis",
        },
      ],
    },
    {
      slug: "marketing",
      name: "Personnalisation et publicité",
      description:
        "Mesure de l'efficacité des campagnes et contenus adaptés sur d'autres sites.",
      isEssential: false,
      position: 3,
      trackers: [],
    },
  ];

  for (const category of categories) {
    const { trackers, ...data } = category;
    const saved = await prisma.cookieCategory.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });

    for (const tracker of trackers) {
      const existing = await prisma.cookieTracker.findFirst({
        where: { categoryId: saved.id, name: tracker.name },
      });
      if (existing) {
        await prisma.cookieTracker.update({
          where: { id: existing.id },
          data: tracker,
        });
      } else {
        await prisma.cookieTracker.create({
          data: { ...tracker, categoryId: saved.id },
        });
      }
    }
  }

  console.log(`· ${categories.length} catégories de cookies`);
}

async function seedContent() {
  let count = 0;

  for (const [key, value] of Object.entries(CONTENT_DEFAULTS)) {
    // On ne réécrit jamais un contenu déjà personnalisé depuis l'admin.
    const existing = await prisma.contentBlock.findUnique({ where: { key } });
    if (existing) continue;

    await prisma.contentBlock.create({
      data: {
        key,
        group: key.split(".")[0] ?? "general",
        label: key,
        type: "TEXT",
        value,
      },
    });
    count += 1;
  }

  console.log(`· ${count} blocs de contenu créés`);
}

async function main() {
  console.log("Initialisation de la base Mate by Mathias…\n");

  await seedCategories();
  await seedShipping();
  await seedCustomization();
  await seedCookies();
  await seedContent();
  await seedAdmin();

  console.log("\nTerminé.");
  console.log(
    "Pensez à compléter les mentions légales dans Administration → Contenu avant toute mise en ligne.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
