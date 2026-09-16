/**
 * Barème et calcul de l'atelier de personnalisation.
 *
 * Ce module est volontairement dépourvu de dépendance serveur : la même
 * fonction `estimate` sert à l'affichage en direct dans le navigateur et au
 * calcul du montant enregistré côté serveur. Les deux chiffres ne peuvent
 * donc pas diverger, et la valeur envoyée par le client n'est jamais
 * reprise telle quelle.
 */

export type StepKey = "SUPPORT" | "PAINT" | "FINISH" | "EXTRA";

export type OptionView = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  priceCents: number;
  /** En millièmes : 1200 = ×1,2. */
  priceMultiplier: number;
  isMultiple: boolean;
};

/** Barème par défaut, utilisé tant que l'administration n'a rien enregistré. */
export const DEFAULT_OPTIONS: Record<StepKey, OptionView[]> = {
  SUPPORT: [
    { id: "s1", slug: "cadre", label: "Cadre seul", description: "Cadre nu, fourche non comprise.", priceCents: 45000, priceMultiplier: 1000, isMultiple: false },
    { id: "s2", slug: "cadre-fourche", label: "Cadre et fourche", description: "L'ensemble traité dans la même teinte.", priceCents: 58000, priceMultiplier: 1000, isMultiple: false },
    { id: "s3", slug: "velo-complet", label: "Vélo complet", description: "Démontage, peinture et remontage intégral.", priceCents: 95000, priceMultiplier: 1000, isMultiple: false },
    { id: "s4", slug: "casque", label: "Casque", description: "Préparation spécifique aux matériaux composites.", priceCents: 22000, priceMultiplier: 1000, isMultiple: false },
    { id: "s5", slug: "roues", label: "Roues", description: "La paire, jantes préparées et vernies.", priceCents: 34000, priceMultiplier: 1000, isMultiple: false },
    { id: "s6", slug: "composants", label: "Composants", description: "Potence, cintre, tige de selle, chape de dérailleur.", priceCents: 18000, priceMultiplier: 1000, isMultiple: false },
    { id: "s7", slug: "autre", label: "Autre projet", description: "Décrivez votre pièce dans le message.", priceCents: 25000, priceMultiplier: 1000, isMultiple: false },
  ],
  PAINT: [
    { id: "p1", slug: "unie", label: "Unie", description: "Une teinte, posée de façon parfaitement régulière.", priceCents: 0, priceMultiplier: 1000, isMultiple: false },
    { id: "p2", slug: "metallisee", label: "Métallisée", description: "Pigments métalliques : la teinte vit avec la lumière.", priceCents: 0, priceMultiplier: 1200, isMultiple: false },
    { id: "p3", slug: "candy", label: "Candy", description: "Base réfléchissante et voiles translucides superposés.", priceCents: 0, priceMultiplier: 1500, isMultiple: false },
    { id: "p4", slug: "cameleon", label: "Caméléon", description: "La couleur change selon l'angle de vue.", priceCents: 0, priceMultiplier: 1850, isMultiple: false },
    { id: "p5", slug: "pailletee", label: "Pailletée", description: "Paillettes en suspension, densité au choix.", priceCents: 0, priceMultiplier: 1400, isMultiple: false },
    { id: "p6", slug: "chrome", label: "Chrome", description: "Effet miroir. Préparation la plus exigeante.", priceCents: 0, priceMultiplier: 2200, isMultiple: false },
    { id: "p7", slug: "personnalisee", label: "Peinture personnalisée", description: "Motif, dégradé ou création dessinée avec vous.", priceCents: 0, priceMultiplier: 2000, isMultiple: false },
  ],
  FINISH: [
    { id: "f1", slug: "mat", label: "Mat", description: "Surface sourde, sans reflet.", priceCents: 0, priceMultiplier: 1050, isMultiple: false },
    { id: "f2", slug: "satine", label: "Satiné", description: "Reflet doux, l'équilibre entre mat et brillant.", priceCents: 0, priceMultiplier: 1000, isMultiple: false },
    { id: "f3", slug: "brillant", label: "Brillant", description: "Profondeur maximale, poli après vernis.", priceCents: 0, priceMultiplier: 1080, isMultiple: false },
  ],
  EXTRA: [
    { id: "e1", slug: "masquages", label: "Masquages", description: "Bandes, filets, séparations nettes entre teintes.", priceCents: 9000, priceMultiplier: 1000, isMultiple: true },
    { id: "e2", slug: "logos", label: "Logos", description: "Reproduction ou création des logos de marque.", priceCents: 7500, priceMultiplier: 1000, isMultiple: true },
    { id: "e3", slug: "stickers", label: "Stickers", description: "Jeu de stickers découpés sur mesure.", priceCents: 4500, priceMultiplier: 1000, isMultiple: true },
    { id: "e4", slug: "personnalisation", label: "Personnalisation", description: "Prénom, numéro, message peint à la main.", priceCents: 6000, priceMultiplier: 1000, isMultiple: true },
    { id: "e5", slug: "effets", label: "Effets spéciaux", description: "Fondus, éclaboussures, textures, marbrures.", priceCents: 14000, priceMultiplier: 1000, isMultiple: true },
    { id: "e6", slug: "dorure", label: "Dorure", description: "Feuille d'or appliquée et protégée.", priceCents: 22000, priceMultiplier: 1000, isMultiple: true },
    { id: "e7", slug: "vernis-special", label: "Vernis spécial", description: "Vernis anti-UV renforcé ou effet particulier.", priceCents: 11000, priceMultiplier: 1000, isMultiple: true },
  ],
};

export type Selection = {
  support: string | null;
  paint: string | null;
  finish: string | null;
  extras: string[];
};

/**
 * Calcule l'estimation :
 *   base du support
 *   × multiplicateur du type de peinture
 *   × multiplicateur de la finition
 *   + somme des options
 *
 * Il ne s'agit que d'une ESTIMATION : l'état réel de la pièce, la complexité
 * des masquages ou la nature des effets peuvent modifier le montant final.
 */
export function estimate(
  options: Record<StepKey, OptionView[]>,
  selection: Selection,
): number {
  const support = options.SUPPORT.find((o) => o.slug === selection.support);
  if (!support) return 0;

  const paint = options.PAINT.find((o) => o.slug === selection.paint);
  const finish = options.FINISH.find((o) => o.slug === selection.finish);

  let total = support.priceCents;
  if (paint) total = Math.round((total * paint.priceMultiplier) / 1000);
  if (finish) total = Math.round((total * finish.priceMultiplier) / 1000);

  for (const slug of selection.extras) {
    const extra = options.EXTRA.find((o) => o.slug === slug);
    if (extra) total += extra.priceCents;
  }

  if (paint) total += paint.priceCents;
  if (finish) total += finish.priceCents;

  return total;
}
