import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Mentions légales",
  description:
    "Informations sur l'éditeur et l'hébergeur du site Mate by Mathias.",
  path: "/mentions-legales",
});

/** Champ non renseigné : on le signale plutôt que de laisser un vide. */
function Value({ value }: { value: string }) {
  return value ? (
    <>{value}</>
  ) : (
    <em className="text-accent">à compléter avant la mise en ligne</em>
  );
}

export default async function MentionsLegalesPage() {
  const c = await getContent();

  return (
    <LegalLayout
      title="Mentions légales"
      updatedAt="16 septembre 2026"
      intro="Informations exigées par l'article 6 III de la loi du 21 juin 2004 pour la confiance dans l'économie numérique et par l'article L221-5 du code de la consommation."
    >
      <LegalSection id="editeur" title="1. Éditeur du site">
        <ul>
          <li>
            <strong>Dénomination :</strong>{" "}
            <Value value={c["legal.editor.name"] ?? ""} />
          </li>
          <li>
            <strong>Forme juridique :</strong>{" "}
            <Value value={c["legal.editor.status"] ?? ""} />
          </li>
          <li>
            <strong>Siège social :</strong>{" "}
            <Value value={c["legal.editor.address"] ?? ""} />
          </li>
          <li>
            <strong>Numéro SIRET :</strong>{" "}
            <Value value={c["legal.editor.siret"] ?? ""} />
          </li>
          <li>
            <strong>Numéro de TVA intracommunautaire :</strong>{" "}
            <Value value={c["legal.editor.vat"] ?? ""} />
          </li>
          <li>
            <strong>Directeur de la publication :</strong>{" "}
            <Value value={c["legal.editor.director"] ?? ""} />
          </li>
          <li>
            <strong>Contact :</strong>{" "}
            <a href={`mailto:${c["contact.email"]}`}>{c["contact.email"]}</a>
            {c["contact.phone"] ? ` — ${c["contact.phone"]}` : null}
          </li>
        </ul>
        <p>
          Si l&apos;activité est soumise à une inscription au registre du
          commerce et des sociétés ou au répertoire des métiers, la mention et
          le numéro correspondants doivent figurer ci-dessus. Il en va de même
          pour l&apos;assurance responsabilité civile professionnelle
          (assureur, numéro de police, couverture géographique) lorsqu&apos;elle
          est exigée.
        </p>
      </LegalSection>

      <LegalSection id="hebergeur" title="2. Hébergeur">
        <ul>
          <li>
            <strong>Dénomination :</strong>{" "}
            <Value value={c["legal.host.name"] ?? ""} />
          </li>
          <li>
            <strong>Adresse :</strong>{" "}
            <Value value={c["legal.host.address"] ?? ""} />
          </li>
          <li>
            <strong>Contact :</strong>{" "}
            <Value value={c["legal.host.contact"] ?? ""} />
          </li>
        </ul>
        <p>
          Les données de la boutique sont hébergées au sein de l&apos;Union
          européenne. Le détail des prestataires intervenant dans le traitement
          des données figure dans la{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>

      <LegalSection id="propriete" title="3. Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus présents sur ce site — textes,
          photographies, vidéos, créations graphiques, identité visuelle,
          motifs et réalisations de peinture — est protégé par le droit
          d&apos;auteur et demeure la propriété de l&apos;éditeur ou de ses
          ayants droit.
        </p>
        <p>
          Toute reproduction, représentation, adaptation ou exploitation, même
          partielle, sans autorisation écrite préalable est interdite. Les
          marques et logos de tiers présents sur le site restent la propriété
          de leurs titulaires respectifs.
        </p>
      </LegalSection>

      <LegalSection id="responsabilite" title="4. Responsabilité">
        <p>
          L&apos;éditeur apporte le plus grand soin à l&apos;exactitude des
          informations publiées, notamment aux descriptions, caractéristiques
          et disponibilités des produits. Des erreurs ou omissions restent
          néanmoins possibles ; elles ne sauraient engager sa responsabilité.
        </p>
        <p>
          Les photographies des réalisations sont données à titre
          d&apos;illustration. Une teinte, un effet caméléon ou un rendu
          métallisé peuvent varier selon la lumière, le support et
          l&apos;écran de consultation.
        </p>
        <p>
          Les liens vers des sites tiers sont fournis pour information.
          L&apos;éditeur n&apos;exerce aucun contrôle sur leur contenu et
          décline toute responsabilité à leur égard.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="5. Données personnelles et cookies">
        <p>
          Le traitement des données personnelles est décrit dans la{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
          L&apos;usage des traceurs est détaillé dans la{" "}
          <a href="/cookies">politique de cookies</a>, depuis laquelle vous
          pouvez à tout moment modifier ou retirer votre consentement.
        </p>
      </LegalSection>

      <LegalSection id="litiges" title="6. Droit applicable et litiges">
        <p>
          Le présent site est soumis au droit français. En cas de litige, une
          solution amiable sera recherchée en priorité, en écrivant à{" "}
          <a href={`mailto:${c["contact.email"]}`}>{c["contact.email"]}</a>.
        </p>
        <p>
          Conformément aux articles L611-1 et suivants du code de la
          consommation, le consommateur peut recourir gratuitement à un
          médiateur de la consommation. Les coordonnées du médiateur retenu
          doivent être indiquées dans les{" "}
          <a href="/cgv">conditions générales de vente</a>. La plateforme
          européenne de règlement en ligne des litiges est accessible à
          l&apos;adresse{" "}
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
    </LegalLayout>
  );
}
