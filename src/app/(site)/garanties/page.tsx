import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Garanties légales et service après-vente",
  description:
    "Garantie de conformité, garantie des vices cachés, durée, gratuité, et comment faire jouer vos droits auprès de l'atelier.",
  path: "/garanties",
});

export default async function GarantiesPage() {
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";

  return (
    <LegalLayout
      title="Garanties légales et service après-vente"
      updatedAt="17 septembre 2026"
      intro="Les garanties décrites ici sont d'ordre public : elles s'appliquent de plein droit, gratuitement, indépendamment de toute garantie commerciale et sans que vous ayez à les négocier."
    >
      <LegalSection id="conformite" title="1. Garantie légale de conformité">
        <p>
          Articles L217-3 et suivants du code de la consommation. Nous sommes
          tenus de vous livrer un bien conforme au contrat et répondons des
          défauts de conformité existant au moment de la délivrance.
        </p>
        <p>
          <strong className="text-foreground">Durée : deux ans</strong> à compter
          de la délivrance du bien.
        </p>
        <p>
          <strong className="text-foreground">
            Vous n&apos;avez rien à prouver.
          </strong>{" "}
          Pendant les vingt-quatre mois suivant la délivrance d&apos;un bien
          neuf, le défaut est présumé exister au jour de la délivrance. C&apos;est
          à nous de démontrer le contraire, pas à vous de démontrer le défaut.
        </p>
        <p>
          <strong className="text-foreground">Ce que vous pouvez demander :</strong>{" "}
          la réparation ou le remplacement, à votre choix. Nous ne pouvons
          écarter votre choix que si l&apos;option retenue entraîne un coût
          manifestement disproportionné, et nous devons alors le justifier
          (article L217-12).
        </p>
        <p>
          Si la réparation ou le remplacement est impossible, tardif, ou vous
          cause un inconvénient majeur, vous pouvez obtenir la réduction du prix
          ou la résolution du contrat.
        </p>
        <p>
          Toute remise en état effectuée au titre de cette garantie{" "}
          <strong className="text-foreground">prolonge la garantie de six mois</strong>{" "}
          (article L217-13).
        </p>
      </LegalSection>

      <LegalSection id="vices-caches" title="2. Garantie des vices cachés">
        <p>
          Articles 1641 et suivants du code civil. Elle couvre les défauts
          cachés rendant le bien impropre à son usage, ou diminuant cet usage au
          point que vous ne l&apos;auriez pas acheté, ou à un moindre prix.
        </p>
        <p>
          <strong className="text-foreground">Délai : deux ans</strong> à compter
          de la découverte du vice.
        </p>
        <p>
          Vous pouvez choisir entre rendre le bien et vous faire restituer le
          prix, ou le garder et vous faire rendre une partie du prix.
        </p>
      </LegalSection>

      <LegalSection id="travaux" title="3. Prestations de peinture et de restauration">
        <p>
          Une prestation de peinture est un contrat d&apos;entreprise. Nous
          répondons des défauts d&apos;exécution qui nous sont imputables :
          adhérence insuffisante, coulures, écaillage prématuré, teinte non
          conforme à celle validée au devis.
        </p>
        <p>
          Sont en revanche exclus les désordres provenant du support lui-même
          lorsqu&apos;il présentait des faiblesses signalées au devis, ainsi que
          ceux survenus après intervention d&apos;un tiers sur la pièce.
        </p>
      </LegalSection>

      <LegalSection id="exclusions" title="4. Ce qui n'est pas couvert">
        <ul>
          <li>L&apos;usure normale liée à l&apos;usage.</li>
          <li>
            Les dommages résultant d&apos;une chute, d&apos;un choc ou d&apos;un
            accident.
          </li>
          <li>
            Un entretien inadapté : nettoyeur haute pression sur les arêtes,
            dégraissants agressifs, solvants.
          </li>
          <li>
            Une exposition prolongée aux ultraviolets sans protection, qui ternit
            toute peinture à la longue.
          </li>
          <li>
            Les modifications apportées au produit après livraison, y compris
            les perçages et le ponçage.
          </li>
        </ul>
        <p>
          Ces exclusions ne concernent que les garanties : un défaut qui existait
          à la livraison reste couvert même si le produit a été utilisé depuis.
        </p>
      </LegalSection>

      <LegalSection id="mise-en-oeuvre" title="5. Comment faire jouer une garantie">
        <p>
          Écrivez-nous à <a href={`mailto:${contact}`}>{contact}</a> ou déposez un
          dossier via le <a href="/reclamations">formulaire de réclamation</a>, en
          indiquant votre numéro de commande, la date de réception et ce que vous
          constatez, photographies à l&apos;appui.
        </p>
        <p>
          Nous accusons réception sous quarante-huit heures ouvrées et vous
          indiquons la marche à suivre. La mise en œuvre de la garantie est{" "}
          <strong className="text-foreground">gratuite</strong> : ni frais de
          dossier, ni frais de retour, ni frais de réexpédition.
        </p>
      </LegalSection>

      <LegalSection id="sav" title="6. Service après-vente hors garantie">
        <p>
          L&apos;atelier assure aussi des interventions qui ne relèvent
          d&apos;aucune garantie : retouche après une chute, reprise de vernis
          terni, remise en teinte d&apos;une zone frottée par un câble. Ces
          travaux font l&apos;objet d&apos;un devis.
        </p>
        <p>
          Nous conservons les références des teintes utilisées sur les pièces
          sorties de l&apos;atelier : une retouche des années plus tard reste
          possible, à l&apos;identique.
        </p>
      </LegalSection>

      <LegalSection id="rappel" title="7. Rappel légal">
        <p>
          Aucune clause de ce site ne peut réduire ni écarter les garanties
          légales. Une garantie commerciale, si elle existe, s&apos;ajoute à ces
          garanties sans jamais s&apos;y substituer.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
