import Link from "next/link";

import { DataRightsPanel } from "@/components/auth/data-rights-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mes données personnelles",
  description: "Exercer vos droits sur vos données personnelles.",
  path: "/compte/donnees",
  noIndex: true,
});

export default function DonneesPage() {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-2xl">Mes données personnelles</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
          Vous pouvez exercer directement ici vos droits d&apos;accès, de
          portabilité et d&apos;effacement. Pour une rectification, une
          opposition ou une limitation, écrivez-nous depuis la{" "}
          <Link href="/contact" className="underline hover:text-accent">
            page de contact
          </Link>{" "}
          : votre demande sera enregistrée et traitée dans le délai légal
          d&apos;un mois.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
          Le détail des traitements, des durées de conservation et des
          destinataires figure dans la{" "}
          <Link href="/confidentialite" className="underline hover:text-accent">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>

      <DataRightsPanel />
    </div>
  );
}
