import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Retours et remboursements",
  description:
    "Dans quels cas un retour est possible, comment le préparer, qui paie les frais et sous quel délai vous êtes remboursé.",
  path: "/retours-remboursements",
});

export default async function RetoursPage() {
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";
  const adresse = c["legal.editor.address"] || "[adresse de l'atelier]";

  return (
    <LegalLayout
      title="Retours et remboursements"
      updatedAt="17 septembre 2026"
      intro="Cette page décrit les situations de retour, la marche à suivre, la prise en charge des frais et les délais de remboursement."
    >
      <LegalSection id="cas" title="1. Dans quels cas un retour est possible">
        <p>Trois situations, aux règles différentes :</p>
        <table>
          <thead>
            <tr>
              <th>Situation</th>
              <th>Délai</th>
              <th>Frais de retour</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Rétractation</strong> — vous changez d&apos;avis, sans
                avoir à vous justifier
              </td>
              <td>14 jours après réception</td>
              <td>À votre charge</td>
            </tr>
            <tr>
              <td>
                <strong>Produit non conforme ou défectueux</strong> — garantie
                légale de conformité
              </td>
              <td>2 ans après la délivrance</td>
              <td>À notre charge</td>
            </tr>
            <tr>
              <td>
                <strong>Erreur de notre part</strong> — mauvais article,
                article manquant, colis endommagé
              </td>
              <td>Dès constatation</td>
              <td>À notre charge</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong className="text-foreground">Exception importante.</strong> Les
          pièces peintes selon vos spécifications — teinte composée pour vous,
          motif, logo, dorure, personnalisation dédiée — sont des biens
          nettement personnalisés. Le droit de rétractation ne s&apos;y applique
          pas, conformément à l&apos;article L221-28, 3° du code de la
          consommation. Les garanties légales, elles, continuent de
          s&apos;appliquer pleinement : un défaut reste un défaut, qu&apos;il
          s&apos;agisse d&apos;une pièce de série ou d&apos;une pièce unique.
        </p>
      </LegalSection>

      <LegalSection id="marche-a-suivre" title="2. Comment procéder">
        <ol>
          <li>
            <strong>Prévenez-nous</strong> par le{" "}
            <a href="/reclamations">formulaire de réclamation</a> ou à{" "}
            <a href={`mailto:${contact}`}>{contact}</a>, en indiquant votre
            numéro de commande. Un dossier est ouvert et vous recevez un
            accusé de réception.
          </li>
          <li>
            <strong>Attendez notre retour</strong> avant d&apos;expédier quoi
            que ce soit : nous vous confirmons l&apos;adresse et, le cas
            échéant, vous fournissons une étiquette de retour lorsque les frais
            sont à notre charge.
          </li>
          <li>
            <strong>Emballez soigneusement.</strong> Un cadre doit être protégé
            tube par tube, avec des cales aux points de contact. Un produit
            abîmé pendant le transport retour reste sous votre responsabilité
            pour la rétractation.
          </li>
          <li>
            <strong>Conservez la preuve d&apos;expédition.</strong> Elle
            déclenche le délai de remboursement.
          </li>
        </ol>
        <p>
          Adresse de retour, sauf indication contraire de notre part :{" "}
          {adresse}.
        </p>
      </LegalSection>

      <LegalSection id="etat" title="3. Dans quel état renvoyer le produit">
        <p>
          Le produit doit être complet, avec ses accessoires et sa
          documentation, dans un état permettant sa revente. Vous pouvez
          l&apos;examiner comme vous le feriez en boutique, mais pas
          l&apos;utiliser.
        </p>
        <p>
          Concrètement : un casque essayé se reprend, un casque porté en
          sortie ne se reprend pas. Un cadre déballé et manipulé se reprend, un
          cadre monté et roulé ne peut plus être considéré comme neuf. Votre
          responsabilité n&apos;est engagée qu&apos;à hauteur de la
          dépréciation constatée, et nous vous en indiquons le motif.
        </p>
      </LegalSection>

      <LegalSection id="remboursement" title="4. Remboursement">
        <p>
          Nous remboursons l&apos;intégralité des sommes versées, frais de
          livraison standard compris, au plus tard <strong>quatorze jours</strong>{" "}
          après avoir été informés de votre décision de rétractation.
        </p>
        <p>
          Le remboursement peut être différé jusqu&apos;à la récupération du
          bien ou jusqu&apos;à la preuve de son expédition, la date retenue
          étant celle du premier de ces deux faits.
        </p>
        <p>
          Il est effectué par le même moyen de paiement que celui utilisé lors
          de la commande, sauf accord exprès de votre part pour un autre moyen,
          et sans frais pour vous.
        </p>
        <p>
          Si vous aviez choisi un mode de livraison plus coûteux que
          l&apos;offre standard, seul le montant de la livraison standard est
          remboursé.
        </p>
      </LegalSection>

      <LegalSection id="echange" title="5. Échange">
        <p>
          Nous n&apos;avons pas de procédure d&apos;échange automatique : un
          retour donne lieu à un remboursement, et vous repassez commande pour
          l&apos;article souhaité. C&apos;est plus rapide et plus lisible pour
          tout le monde. Si la pièce de remplacement est immédiatement
          disponible, écrivez-nous : nous nous arrangeons.
        </p>
      </LegalSection>

      <LegalSection id="prestations" title="6. Prestations de peinture">
        <p>
          Une prestation acceptée sur devis suit des règles propres, précisées
          au devis : conditions d&apos;annulation avant démarrage des travaux,
          sort de l&apos;acompte, et modalités de reprise en cas de défaut
          imputable à l&apos;atelier.
        </p>
        <p>
          Une fois la mise en peinture engagée, la pièce ne peut plus revenir à
          son état antérieur : les demandes de modification doivent nous
          parvenir avant le lancement des travaux, dont la date vous est
          communiquée.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
