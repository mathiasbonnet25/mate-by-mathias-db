import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Livraison et retours",
  description:
    "Tarifs, délais et zones de livraison, conditions de retour et gestion des colis endommagés.",
  path: "/livraison",
});

export default async function LivraisonPage() {
  const rates = await prisma.shippingRate
    .findMany({ where: { isActive: true }, orderBy: { position: "asc" } })
    .catch(() => []);

  return (
    <LegalLayout
      title="Livraison et retours"
      updatedAt="16 septembre 2026"
      intro="Tarifs, délais, zones desservies et conditions de retour."
    >
      <LegalSection id="tarifs" title="1. Tarifs et délais">
        {rates.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Zone</th>
                <th>Tarif</th>
                <th>Délai indicatif</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id}>
                  <td>{rate.name}</td>
                  <td>{rate.zone}</td>
                  <td>
                    {formatPrice(rate.priceCents)}
                    {rate.freeAboveCents != null && (
                      <>
                        <br />
                        <span className="text-[12px]">
                          offert dès {formatPrice(rate.freeAboveCents)}
                        </span>
                      </>
                    )}
                  </td>
                  <td>{rate.deliveryEstimate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>
            Les tarifs de livraison sont calculés au panier, selon la
            destination et le poids de la commande. Ils vous sont indiqués
            avant tout paiement.
          </p>
        )}
        <p>
          Les délais sont donnés à titre indicatif et courent à compter de
          l&apos;expédition. Conformément à l&apos;article L216-1 du code de la
          consommation, la livraison intervient au plus tard trente jours après
          la conclusion du contrat, sauf délai différent convenu au devis pour
          les pièces réalisées à l&apos;atelier.
        </p>
      </LegalSection>

      <LegalSection id="emballage" title="2. Emballage des cadres">
        <p>
          Les cadres peints sont protégés individuellement : mousse sur chaque
          tube, cales aux points de contact, carton double cannelure. Chaque
          envoi est assuré à la valeur déclarée de la pièce.
        </p>
      </LegalSection>

      <LegalSection id="reception" title="3. À la réception">
        <p>
          Vérifiez l&apos;état du colis devant le livreur. En cas de dommage
          visible, portez des réserves précises et détaillées sur le bordereau
          — « sous réserve de déballage » n&apos;a aucune valeur — puis
          signalez-le-nous sous trois jours, photographies à l&apos;appui.
        </p>
      </LegalSection>

      <LegalSection id="retours" title="4. Retours">
        <p>
          Vous disposez de quatorze jours après réception pour exercer votre
          droit de rétractation sur les articles du catalogue. Les pièces
          peintes selon vos spécifications en sont exclues : voir la page{" "}
          <a href="/retractation">droit de rétractation</a>, qui détaille les
          modalités, les frais et les délais de remboursement.
        </p>
      </LegalSection>

      <LegalSection id="international" title="5. Hors Union européenne">
        <p>
          Pour les expéditions hors Union européenne, des droits de douane et
          taxes locales peuvent s&apos;appliquer à la réception. Ils restent à
          la charge du destinataire et ne sont pas inclus dans le prix affiché.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
