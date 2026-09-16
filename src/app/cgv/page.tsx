import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Conditions générales de vente",
  description:
    "Conditions générales de vente applicables aux cadres, vélos, équipements et prestations de peinture personnalisée de Mate by Mathias.",
  path: "/cgv",
});

export default async function CgvPage() {
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";

  return (
    <LegalLayout
      title="Conditions générales de vente"
      updatedAt="16 septembre 2026"
      intro="Les présentes conditions régissent les ventes de produits et les prestations de peinture personnalisée réalisées par l'atelier à destination des consommateurs. Elles sont acceptées expressément avant toute commande."
    >
      <LegalSection id="objet" title="Article 1 — Objet et champ d'application">
        <p>
          Les présentes conditions générales de vente s&apos;appliquent à
          l&apos;ensemble des commandes passées sur le site, qu&apos;il
          s&apos;agisse de la vente de cadres, vélos, vêtements, équipements et
          accessoires, ou de prestations de peinture, de personnalisation et de
          restauration.
        </p>
        <p>
          Elles sont mises à disposition avant la commande et acceptées par une
          case à cocher distincte. Elles prévalent sur toute autre condition,
          sauf accord écrit préalable.
        </p>
      </LegalSection>

      <LegalSection id="produits" title="Article 2 — Produits et prestations">
        <p>
          Les caractéristiques essentielles de chaque produit figurent sur sa
          fiche : description, dimensions, matériaux, coloris, disponibilité.
          Les photographies sont les plus fidèles possibles, mais un écran ne
          restitue pas exactement une teinte : des variations de nuance, de
          brillance et d&apos;effet métallisé, candy ou caméléon peuvent
          apparaître entre l&apos;image et la pièce réelle.
        </p>
        <p>
          Les prestations de peinture personnalisée sont réalisées à la
          demande, sur la base d&apos;un devis accepté. Le résultat dépend de
          l&apos;état du support fourni : d&apos;éventuels défauts,
          corrosions ou réparations antérieures peuvent nécessiter des travaux
          complémentaires, qui font alors l&apos;objet d&apos;un devis
          rectificatif soumis à votre accord avant exécution.
        </p>
      </LegalSection>

      <LegalSection id="prix" title="Article 3 — Prix">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises, hors frais
          de livraison. Le taux de TVA applicable est celui en vigueur au jour
          de la commande. Les frais de livraison sont indiqués avant validation
          de la commande, selon la destination et le poids.
        </p>
        <p>
          L&apos;estimateur de l&apos;atelier de personnalisation fournit un
          ordre de grandeur indicatif. Il ne constitue ni une offre ni un
          devis : seul le devis écrit, daté et accepté engage les parties.
        </p>
        <p>
          L&apos;éditeur se réserve le droit de modifier ses prix à tout
          moment ; les produits sont facturés au tarif en vigueur au moment de
          l&apos;enregistrement de la commande.
        </p>
      </LegalSection>

      <LegalSection id="commande" title="Article 4 — Commande">
        <p>
          La commande suit les étapes suivantes : sélection des articles,
          vérification du panier, saisie des coordonnées et de l&apos;adresse
          de livraison, acceptation des présentes conditions, puis paiement.
          Avant le paiement, le récapitulatif vous permet de corriger
          d&apos;éventuelles erreurs de saisie, conformément à l&apos;article
          1127-2 du code civil.
        </p>
        <p>
          La vente est conclue lors de la confirmation du paiement. Un courriel
          récapitulatif vous est alors adressé. L&apos;éditeur se réserve le
          droit de refuser une commande anormale, manifestement frauduleuse, ou
          émanant d&apos;un client avec lequel un litige est en cours.
        </p>
      </LegalSection>

      <LegalSection id="paiement" title="Article 5 — Paiement">
        <p>
          Le paiement s&apos;effectue par carte bancaire, PayPal, Apple Pay ou
          Google Pay, via les pages sécurisées de nos prestataires. Aucun
          numéro de carte n&apos;est saisi ni conservé sur le site.
        </p>
        <p>
          Les commandes sont payables comptant à la commande. Pour les projets
          sur mesure, un acompte peut être demandé au lancement des travaux,
          selon les modalités fixées au devis ; le solde est exigible avant
          l&apos;expédition ou la restitution de la pièce.
        </p>
      </LegalSection>

      <LegalSection id="livraison" title="Article 6 — Livraison">
        <p>
          Les produits en stock sont expédiés sous 2 à 4 jours ouvrés en France
          métropolitaine. Les pièces peintes ou restaurées sont expédiées à
          l&apos;issue des travaux, dans le délai indiqué au devis.
        </p>
        <p>
          Conformément à l&apos;article L216-1 du code de la consommation, la
          livraison intervient au plus tard trente jours après la conclusion du
          contrat, sauf délai différent convenu au devis. En cas de retard, vous
          pouvez enjoindre l&apos;éditeur de livrer dans un délai
          supplémentaire raisonnable puis, à défaut, résoudre le contrat ; les
          sommes versées vous sont alors remboursées dans les quatorze jours.
        </p>
        <p>
          Les risques sont transférés à la remise du colis. À la réception,
          vérifiez l&apos;état de l&apos;emballage et du produit : toute avarie
          doit être signalée au transporteur par réserves précises sur le
          bordereau, et nous être signalée sous trois jours.
        </p>
      </LegalSection>

      <LegalSection id="retractation" title="Article 7 — Droit de rétractation">
        <p>
          Vous disposez d&apos;un délai de quatorze jours à compter de la
          réception pour exercer votre droit de rétractation, sans avoir à
          motiver votre décision ni à supporter d&apos;autre coût que celui du
          retour (art. L221-18 du code de la consommation).
        </p>
        <p>
          <strong className="text-foreground">Exception importante.</strong>{" "}
          Conformément à l&apos;article L221-28, 3° du même code, le droit de
          rétractation ne peut être exercé pour les biens confectionnés selon
          vos spécifications ou nettement personnalisés : peinture sur mesure,
          teinte composée pour vous, motifs, logos, dorure ou toute
          personnalisation dédiée. Cette perte du droit de rétractation vous est
          rappelée et confirmée expressément avant la commande.
        </p>
        <p>
          Les modalités pratiques, le formulaire type et les délais de
          remboursement figurent sur la page{" "}
          <a href="/retractation">droit de rétractation</a>.
        </p>
      </LegalSection>

      <LegalSection id="garanties" title="Article 8 — Garanties légales">
        <p>
          Tous les produits bénéficient des garanties légales, indépendamment
          de toute garantie commerciale :
        </p>
        <ul>
          <li>
            <strong>Garantie légale de conformité</strong> (art. L217-3 et
            suivants du code de la consommation) : vous disposez de deux ans à
            compter de la délivrance pour agir. Pendant les vingt-quatre mois
            suivant la délivrance d&apos;un bien neuf, le défaut est présumé
            exister au jour de la délivrance : vous n&apos;avez pas à en
            rapporter la preuve. Vous pouvez choisir entre la réparation et le
            remplacement, sous réserve des conditions de coût prévues à
            l&apos;article L217-12.
          </li>
          <li>
            <strong>Garantie des vices cachés</strong> (art. 1641 et suivants du
            code civil) : vous pouvez obtenir la résolution de la vente ou une
            réduction du prix, dans un délai de deux ans à compter de la
            découverte du vice.
          </li>
        </ul>
        <p>
          La mise en œuvre de ces garanties est gratuite. Pour les activer,
          écrivez à <a href={`mailto:${contact}`}>{contact}</a> en décrivant le
          défaut et en joignant des photographies.
        </p>
        <p>
          Ne relèvent pas de la garantie l&apos;usure normale, les dommages
          résultant d&apos;une chute, d&apos;un choc, d&apos;un entretien
          inadapté, de produits de nettoyage agressifs ou d&apos;une exposition
          prolongée aux ultraviolets sans protection.
        </p>
      </LegalSection>

      <LegalSection id="sav" title="Article 9 — Service après-vente">
        <p>
          Le service après-vente est assuré directement par l&apos;atelier, à
          l&apos;adresse <a href={`mailto:${contact}`}>{contact}</a>. Les
          retouches de peinture, reprises de vernis et remises en état sont
          étudiées au cas par cas, sur devis lorsqu&apos;elles ne relèvent pas
          d&apos;une garantie.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="Article 10 — Données personnelles">
        <p>
          Le traitement des données liées à la commande est décrit dans la{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>

      <LegalSection id="litiges" title="Article 11 — Réclamations et médiation">
        <p>
          Toute réclamation peut être adressée à{" "}
          <a href={`mailto:${contact}`}>{contact}</a>. Nous accusons réception
          sous quarante-huit heures ouvrées et nous efforçons d&apos;apporter
          une réponse sous quinze jours.
        </p>
        <p>
          À défaut de solution amiable, vous pouvez recourir gratuitement à un
          médiateur de la consommation dans un délai d&apos;un an à compter de
          votre réclamation écrite (art. L612-1 et suivants du code de la
          consommation). Les coordonnées du médiateur retenu par
          l&apos;atelier doivent être insérées ici avant la mise en ligne. La
          plateforme européenne de règlement en ligne des litiges est
          accessible à l&apos;adresse{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="droit" title="Article 12 — Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit français. En cas de
          litige, les tribunaux français sont compétents. Les dispositions
          protectrices du consommateur de son pays de résidence au sein de
          l&apos;Union européenne demeurent applicables.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
