import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Droit de rétractation",
  description:
    "Conditions, délais et formulaire type pour exercer votre droit de rétractation, et cas des pièces personnalisées.",
  path: "/retractation",
});

export default async function RetractationPage() {
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";
  const address = c["legal.editor.address"] || "[adresse de l'atelier]";
  const name = c["legal.editor.name"] || "[dénomination de l'éditeur]";

  return (
    <LegalLayout
      title="Droit de rétractation"
      updatedAt="16 septembre 2026"
      intro="Comment renoncer à votre achat, dans quel délai, et dans quels cas ce droit ne s'applique pas."
    >
      <LegalSection id="principe" title="1. Le principe">
        <p>
          Vous disposez de quatorze jours à compter de la réception du produit
          pour exercer votre droit de rétractation, sans avoir à motiver votre
          décision ni à supporter de pénalité. Lorsque la commande porte sur
          plusieurs biens livrés séparément, le délai court à compter de la
          réception du dernier bien.
        </p>
        <p>
          Pour exercer ce droit, informez-nous de votre décision par une
          déclaration dénuée d&apos;ambiguïté : courriel à{" "}
          <a href={`mailto:${contact}`}>{contact}</a>, ou courrier à
          l&apos;adresse de l&apos;atelier. Vous pouvez utiliser le formulaire
          type ci-dessous, sans obligation.
        </p>
      </LegalSection>

      <LegalSection id="exceptions" title="2. Les exceptions">
        <p>
          Conformément à l&apos;article L221-28 du code de la consommation, le
          droit de rétractation ne peut pas être exercé pour :
        </p>
        <ul>
          <li>
            les biens confectionnés selon vos spécifications ou nettement
            personnalisés — c&apos;est le cas de toute peinture sur mesure,
            teinte composée pour vous, motif, logo, dorure ou personnalisation
            dédiée ;
          </li>
          <li>
            les prestations de service pleinement exécutées avant la fin du
            délai, lorsque vous en avez expressément demandé l&apos;exécution
            et reconnu la perte de votre droit ;
          </li>
          <li>
            les biens descellés par vos soins et qui ne peuvent être renvoyés
            pour des raisons d&apos;hygiène.
          </li>
        </ul>
        <p>
          Cette exclusion est signalée sur la fiche de chaque article concerné
          et fait l&apos;objet d&apos;une confirmation expresse de votre part
          avant le paiement.
        </p>
      </LegalSection>

      <LegalSection id="retour" title="3. Le retour">
        <p>
          Renvoyez le produit sans retard excessif et au plus tard quatorze
          jours après nous avoir communiqué votre décision. Les frais directs
          de renvoi sont à votre charge. Le produit doit être retourné complet,
          dans son emballage d&apos;origine si possible, en parfait état de
          revente.
        </p>
        <p>
          Votre responsabilité n&apos;est engagée qu&apos;à l&apos;égard de la
          dépréciation résultant de manipulations autres que celles nécessaires
          pour établir la nature, les caractéristiques et le bon fonctionnement
          du bien. Un cadre monté et roulé, par exemple, ne peut plus être
          considéré comme neuf.
        </p>
      </LegalSection>

      <LegalSection id="remboursement" title="4. Le remboursement">
        <p>
          Nous vous remboursons l&apos;intégralité des sommes versées, frais de
          livraison standard compris, au plus tard quatorze jours après avoir
          été informés de votre décision. Le remboursement peut être différé
          jusqu&apos;à la récupération du bien ou jusqu&apos;à la preuve de son
          expédition, la date retenue étant celle du premier de ces faits.
        </p>
        <p>
          Le remboursement est effectué par le même moyen de paiement que celui
          utilisé lors de la commande, sauf accord exprès pour un autre moyen,
          et sans frais pour vous.
        </p>
      </LegalSection>

      <LegalSection id="formulaire" title="5. Formulaire type de rétractation">
        <p>
          Vous pouvez recopier et compléter le texte suivant. Son usage
          n&apos;est pas obligatoire.
        </p>
        <div className="rounded-lg border border-line p-6 text-[14px] leading-[1.9]">
          <p>À l&apos;attention de {name}, {address} — {contact}</p>
          <p className="mt-4">
            Je vous notifie par la présente ma rétractation du contrat portant
            sur la vente du bien ci-dessous :
          </p>
          <p className="mt-4">
            Commandé le : ____________ / Reçu le : ____________
            <br />
            Numéro de commande : ____________
            <br />
            Désignation du produit : ____________
            <br />
            Nom du consommateur : ____________
            <br />
            Adresse du consommateur : ____________
            <br />
            Date : ____________
            <br />
            Signature (uniquement en cas de notification sur papier) :
            ____________
          </p>
        </div>
      </LegalSection>
    </LegalLayout>
  );
}
