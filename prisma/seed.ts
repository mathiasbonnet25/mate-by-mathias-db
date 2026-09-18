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

/**
 * Produits de démonstration.
 *
 * Ils existent pour qu'un site fraîchement installé ne présente pas deux
 * boutiques vides, et pour que les filtres — couleur, taille, prix,
 * disponibilité — aient de quoi travailler.
 *
 * Les visuels sont des gabarits générés, pas des photographies : ils
 * portent la mention « visuel de démonstration ». Rien ici ne prétend
 * décrire une réalisation réelle de l'atelier, et tout est à remplacer
 * depuis Administration → Produits avant l'ouverture.
 *
 * Un produit déjà présent n'est jamais réécrit : relancer le seed après
 * avoir retouché une fiche ne détruit pas le travail fait dans l'admin.
 */
type DemoProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  universe: "VELOS" | "EQUIPEMENT";
  categorySlug: string;
  basePriceCents: number;
  compareAtPriceCents?: number;
  isMadeToOrder?: boolean;
  isFeatured?: boolean;
  weightGrams?: number;
  specs: { label: string; value: string }[];
  colors: { name: string; hex: string; image: string }[];
  sizes: string[];
  stockParVariante: number;
};

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: "cadre-chorus",
    name: "Cadre acier Chorus",
    tagline: "Acier effilé, peinture appliquée et poncée à la main",
    description:
      "Un cadre de route en acier, préparé puis peint dans l'atelier. Chaque pièce est décapée, redressée si besoin, apprêtée, peinte au pistolet puis vernie. Les teintes présentées ici sont deux finitions courantes ; toute autre couleur se commande depuis l'atelier de personnalisation.",
    universe: "VELOS",
    categorySlug: "cadres",
    basePriceCents: 129_000,
    isMadeToOrder: true,
    isFeatured: true,
    weightGrams: 1_950,
    specs: [
      { label: "Matière", value: "Acier, tubes effilés" },
      { label: "Jeu de direction", value: "1 pouce 1/8" },
      { label: "Boîtier de pédalier", value: "Filetage anglais" },
      { label: "Passage de pneu", value: "32 mm" },
      { label: "Délai d'atelier", value: "4 à 6 semaines" },
    ],
    colors: [
      { name: "Noir mat", hex: "#16150f", image: "/images/demo/cadre-chorus-noir.jpg" },
      { name: "Ivoire", hex: "#e8e2d6", image: "/images/demo/cadre-chorus-ivoire.jpg" },
    ],
    sizes: ["52", "54", "56"],
    stockParVariante: 2,
  },
  {
    slug: "velo-flaneur",
    name: "Vélo complet Flâneur",
    tagline: "Monté à l'atelier, prêt à rouler",
    description:
      "Un vélo de ville assemblé pièce par pièce sur un cadre repeint. Garde-boue, éclairage et porte-bagages sont posés et réglés avant l'expédition. Le montage est vérifié sur route avant départ.",
    universe: "VELOS",
    categorySlug: "velos-complets",
    basePriceCents: 245_000,
    isMadeToOrder: true,
    isFeatured: true,
    weightGrams: 11_400,
    specs: [
      { label: "Transmission", value: "Moyeu à vitesses intégrées" },
      { label: "Freinage", value: "Patins sur jante" },
      { label: "Pneus", value: "38 mm, flancs beiges" },
      { label: "Équipement", value: "Garde-boue, éclairage, porte-bagages" },
      { label: "Délai d'atelier", value: "6 à 8 semaines" },
    ],
    colors: [
      { name: "Vert bouteille", hex: "#14201a", image: "/images/demo/velo-flaneur.jpg" },
    ],
    sizes: ["M", "L"],
    stockParVariante: 1,
  },
  {
    slug: "roues-ardennes",
    name: "Paire de roues Ardennes",
    tagline: "Rayonnage main, jantes préparées à l'atelier",
    description:
      "Une paire de roues montée à la main : rayons mis en tension un à un, voile et saut contrôlés au comparateur. Livrée avec fond de jante posé.",
    universe: "VELOS",
    categorySlug: "roues",
    basePriceCents: 89_000,
    weightGrams: 1_780,
    specs: [
      { label: "Rayonnage", value: "32 rayons, croisés par trois" },
      { label: "Jantes", value: "Aluminium, hauteur 24 mm" },
      { label: "Corps de roue libre", value: "Compatible 8 à 11 vitesses" },
      { label: "Pneus", value: "De 25 à 35 mm" },
    ],
    colors: [{ name: "Noir", hex: "#121212", image: "/images/demo/roues-ardennes.jpg" }],
    sizes: [],
    stockParVariante: 4,
  },
  {
    slug: "maillot-atelier",
    name: "Maillot Atelier",
    tagline: "Coupe droite, tissu tissé en Italie",
    description:
      "Un maillot à manches courtes, coupe droite, sans marquage voyant. Trois poches dorsales et une poche zippée. Tissu à séchage rapide.",
    universe: "EQUIPEMENT",
    categorySlug: "vetements",
    basePriceCents: 9_500,
    compareAtPriceCents: 11_000,
    weightGrams: 180,
    specs: [
      { label: "Matière", value: "Polyester recyclé, élasthanne" },
      { label: "Coupe", value: "Droite" },
      { label: "Poches", value: "Trois dorsales, une zippée" },
      { label: "Entretien", value: "Lavage à 30 °C, sans adoucissant" },
    ],
    colors: [{ name: "Bleu nuit", hex: "#141a26", image: "/images/demo/maillot-atelier.jpg" }],
    sizes: ["S", "M", "L", "XL"],
    stockParVariante: 6,
  },
  {
    slug: "casque-colline",
    name: "Casque Colline",
    tagline: "Ventilation large, sangles plates",
    description:
      "Un casque de route léger, bien ventilé, à la molette de serrage accessible d'une main. Conforme à la norme européenne EN 1078.",
    universe: "EQUIPEMENT",
    categorySlug: "casques",
    basePriceCents: 14_900,
    weightGrams: 280,
    specs: [
      { label: "Norme", value: "EN 1078" },
      { label: "Poids", value: "280 g en taille M" },
      { label: "Ventilation", value: "22 ouvertures" },
      { label: "Réglage", value: "Molette arrière" },
    ],
    colors: [{ name: "Blanc", hex: "#f4f1ec", image: "/images/demo/casque-colline.jpg" }],
    sizes: ["M", "L"],
    stockParVariante: 5,
  },
  {
    slug: "gants-brume",
    name: "Gants longs Brume",
    tagline: "Mi-saison, paume renforcée",
    description:
      "Des gants longs pour les sorties fraîches. Paume renforcée, dos coupe-vent, pouce en tissu doux pour s'essuyer le visage.",
    universe: "EQUIPEMENT",
    categorySlug: "gants",
    basePriceCents: 4_500,
    weightGrams: 60,
    specs: [
      { label: "Saison", value: "5 à 15 °C" },
      { label: "Paume", value: "Synthétique renforcé" },
      { label: "Dos", value: "Coupe-vent" },
      { label: "Écran tactile", value: "Index et pouce compatibles" },
    ],
    colors: [{ name: "Gris", hex: "#6f6f6f", image: "/images/demo/gants-brume.jpg" }],
    sizes: ["S", "M", "L"],
    stockParVariante: 8,
  },
];

async function seedProducts() {
  const brand = await prisma.brand.upsert({
    where: { slug: "mate-by-mathias" },
    create: { slug: "mate-by-mathias", name: "Mate by Mathias" },
    update: {},
  });

  let crees = 0;
  let ignores = 0;

  for (const demo of DEMO_PRODUCTS) {
    const existant = await prisma.product.findUnique({
      where: { slug: demo.slug },
      select: { id: true },
    });
    if (existant) {
      ignores += 1;
      continue;
    }

    const categorie = await prisma.category.findUnique({
      where: { slug: demo.categorySlug },
      select: { id: true },
    });

    const product = await prisma.product.create({
      data: {
        slug: demo.slug,
        name: demo.name,
        tagline: demo.tagline,
        description: demo.description,
        universe: demo.universe,
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId: categorie?.id ?? null,
        brandId: brand.id,
        basePriceCents: demo.basePriceCents,
        compareAtPriceCents: demo.compareAtPriceCents ?? null,
        isFeatured: demo.isFeatured ?? false,
        isMadeToOrder: demo.isMadeToOrder ?? false,
        weightGrams: demo.weightGrams ?? null,
        specs: demo.specs,
        seoTitle: `${demo.name} — Mate by Mathias`,
        seoDescription: demo.tagline,
      },
    });

    // Axes de variation. La couleur d'abord : c'est elle qui commande le
    // changement de photos sur la fiche produit.
    const optionCouleur = await prisma.productOption.create({
      data: { productId: product.id, name: "Couleur", position: 0 },
    });
    const valeursCouleur = new Map<string, string>();
    for (const [index, couleur] of demo.colors.entries()) {
      const valeur = await prisma.productOptionValue.create({
        data: {
          optionId: optionCouleur.id,
          value: couleur.name,
          hex: couleur.hex,
          position: index,
        },
      });
      valeursCouleur.set(couleur.name, valeur.id);
    }

    const valeursTaille = new Map<string, string>();
    if (demo.sizes.length > 0) {
      const optionTaille = await prisma.productOption.create({
        data: { productId: product.id, name: "Taille", position: 1 },
      });
      for (const [index, taille] of demo.sizes.entries()) {
        const valeur = await prisma.productOptionValue.create({
          data: { optionId: optionTaille.id, value: taille, position: index },
        });
        valeursTaille.set(taille, valeur.id);
      }
    }

    // Visuel générique du produit, utilisé tant qu'aucune couleur n'est
    // choisie et sur les cartes des pages boutique.
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: demo.colors[0]!.image,
        alt: `${demo.name} — visuel de démonstration`,
        width: 1200,
        height: 1500,
        position: 0,
      },
    });

    // Une variante par combinaison couleur × taille. Chacune reçoit la
    // photo de sa couleur : c'est ce qui fait basculer la galerie quand le
    // visiteur change de pastille.
    const tailles = demo.sizes.length > 0 ? demo.sizes : [null];
    let position = 0;

    for (const couleur of demo.colors) {
      for (const taille of tailles) {
        const suffixe = taille ? `-${taille}` : "";
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${demo.slug}-${slugifyCourt(couleur.name)}${suffixe}`.toUpperCase(),
            label: taille ? `${couleur.name} / ${taille}` : couleur.name,
            stock: demo.stockParVariante,
            allowBackorder: demo.isMadeToOrder ?? false,
            colorName: couleur.name,
            colorHex: couleur.hex,
            sizeName: taille,
            weightGrams: demo.weightGrams ?? null,
            position,
          },
        });
        position += 1;

        await prisma.variantOptionValue.create({
          data: {
            variantId: variant.id,
            optionValueId: valeursCouleur.get(couleur.name)!,
          },
        });
        if (taille) {
          await prisma.variantOptionValue.create({
            data: {
              variantId: variant.id,
              optionValueId: valeursTaille.get(taille)!,
            },
          });
        }

        await prisma.productImage.create({
          data: {
            productId: product.id,
            variantId: variant.id,
            url: couleur.image,
            alt: `${demo.name}, ${couleur.name} — visuel de démonstration`,
            width: 1200,
            height: 1500,
            position: 0,
          },
        });
      }
    }

    crees += 1;
  }

  console.log(`· ${crees} produits de démonstration créés, ${ignores} déjà présents`);
  if (crees > 0) {
    console.log(
      "  Les visuels sont des gabarits : remplacez-les par vos photos dans Administration → Produits.",
    );
  }
}

/** Réduit un libellé à un fragment utilisable dans une référence produit. */
function slugifyCourt(valeur: string) {
  return valeur
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("Initialisation de la base Mate by Mathias…\n");

  await seedCategories();
  await seedShipping();
  await seedCustomization();
  await seedCookies();
  await seedContent();
  await seedProducts();
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
