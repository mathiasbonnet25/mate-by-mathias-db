import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

import {
  DEFAULT_OPTIONS,
  type OptionView,
  type StepKey,
} from "@/lib/customization-shared";

export * from "@/lib/customization-shared";

export const getCustomizationOptions = unstable_cache(
  async (): Promise<Record<StepKey, OptionView[]>> => {
    try {
      const rows = await prisma.customizationOption.findMany({
        where: { isActive: true },
        orderBy: [{ step: "asc" }, { position: "asc" }],
      });
      if (rows.length === 0) return DEFAULT_OPTIONS;

      const grouped: Record<StepKey, OptionView[]> = {
        SUPPORT: [],
        PAINT: [],
        FINISH: [],
        EXTRA: [],
      };
      for (const row of rows) {
        const step = row.step as StepKey;
        if (!grouped[step]) continue;
        grouped[step].push({
          id: row.id,
          slug: row.slug,
          label: row.label,
          description: row.description,
          priceCents: row.priceCents,
          priceMultiplier: row.priceMultiplier,
          isMultiple: row.isMultiple,
        });
      }
      // Une étape vide en base retombe sur le barème par défaut.
      (Object.keys(grouped) as StepKey[]).forEach((key) => {
        if (grouped[key].length === 0) grouped[key] = DEFAULT_OPTIONS[key];
      });
      return grouped;
    } catch {
      return DEFAULT_OPTIONS;
    }
  },
  ["customization-options"],
  { tags: ["customization"], revalidate: 300 },
);

export type Selection = {
  support: string | null;
  paint: string | null;
  finish: string | null;
  extras: string[];
};

/**
 * Calcule l'estimation. Cette fonction est partagée entre le navigateur
 * (affichage en direct) et le serveur (montant réellement enregistré avec
 * la demande) : le chiffre stocké ne peut donc pas être manipulé côté client.
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
