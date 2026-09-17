import { CatalogView, type CatalogSearchParams } from "@/components/shop/catalog-view";
import { PageIntro } from "@/components/shop/page-intro";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const revalidate = 120;

export const metadata = buildMetadata({
  title: "Vêtements & Accessoires",
  description:
    "Casques, chaussures, lunettes, gants, sacs, vêtements et accessoires sélectionnés par l'atelier Mate by Mathias. Filtrez par marque, type, taille, couleur, prix et disponibilité.",
  path: "/equipement",
});

export default async function EquipementPage({
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
              { name: "Vêtements & Accessoires", path: "/equipement" },
            ]),
          ),
        }}
      />

      <PageIntro
        eyebrow="Boutique"
        title="Vêtements & Accessoires"
        description="Casques, chaussures, lunettes, gants, sacs et textile : l'équipement sélectionné par l'atelier, en toutes tailles."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Vêtements & Accessoires", path: "/equipement" },
        ]}
      />

      <CatalogView universe="EQUIPEMENT" searchParams={params} basePath="/equipement" />
    </>
  );
}

