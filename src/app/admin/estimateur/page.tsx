import Link from "next/link";

import { AdminHeader } from "@/components/admin/ui";
import {
  CustomizationEditor,
  type OptionForm,
} from "@/components/admin/customization-editor";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OPTIONS } from "@/lib/customization-shared";

export const dynamic = "force-dynamic";

export const metadata = { title: "Estimateur" };

/**
 * Réglage du barème de l'atelier.
 *
 * Si la base est vide, le formulaire est amorcé avec le barème par défaut
 * — celui que le site sert déjà — pour que l'écran serve de point de
 * départ plutôt que de page blanche.
 */
export default async function AdminEstimateurPage() {
  const enBase = await prisma.customizationOption.findMany({
    orderBy: [{ step: "asc" }, { position: "asc" }],
  });

  const initial: OptionForm[] = enBase.length
    ? enBase.map((o) => ({
        id: o.id,
        step: o.step as OptionForm["step"],
        slug: o.slug,
        label: o.label,
        description: o.description ?? "",
        priceEuros: (o.priceCents / 100).toFixed(2),
        multiplier: (o.priceMultiplier / 1000).toFixed(2),
        isMultiple: o.isMultiple,
        isActive: o.isActive,
      }))
    : (Object.entries(DEFAULT_OPTIONS).flatMap(([step, liste]) =>
        liste.map((o) => ({
          step: step as OptionForm["step"],
          slug: o.slug,
          label: o.label,
          description: o.description ?? "",
          priceEuros: (o.priceCents / 100).toFixed(2),
          multiplier: (o.priceMultiplier / 1000).toFixed(2),
          isMultiple: o.isMultiple,
          isActive: true,
        })),
      ) as OptionForm[]);

  return (
    <>
      <AdminHeader
        title="Estimateur"
        description="Le barème utilisé par l'atelier de personnalisation. Chaque modification s'applique immédiatement sur le site."
        action={
          <Link
            href="/personnalisation"
            target="_blank"
            className="text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
          >
            Voir l&apos;atelier
          </Link>
        }
      />
      <CustomizationEditor initial={initial} />
    </>
  );
}
