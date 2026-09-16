import { Suspense } from "react";

import { CatalogView, type CatalogSearchParams } from "@/components/shop/catalog-view";
import { PageIntro } from "@/components/shop/page-intro";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const revalidate = 120;

export const metadata = buildMetadata({
  title: "Cadres & Vélos",
  description:
    "Cadres nus, vélos complets et pièces restaurées par l'atelier Mate by Mathias. Filtrez par marque, type, taille, couleur, prix et disponibilité.",
  path: "/velos",
});

export default async function VelosPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Accueil", path: "/" },
              { name: "Cadres & Vélos", path: "/velos" },
            ]),
          ),
        }}
      />

      <PageIntro
        eyebrow="Boutique"
        title="Cadres & Vélos"
        description="Des cadres préparés et peints à l'atelier, des vélos complets montés pièce par pièce, et des restaurations menées jusqu'au dernier détail."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Cadres & Vélos", path: "/velos" },
        ]}
      />

      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView universe="VELOS" searchParams={params} basePath="/velos" />
      </Suspense>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="container-page grid grid-cols-2 gap-5 pb-28 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse bg-surface-muted" />
      ))}
    </div>
  );
}
