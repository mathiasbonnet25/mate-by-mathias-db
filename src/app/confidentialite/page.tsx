import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Politique de confidentialité",
  description:
    "Quelles données personnelles nous collectons, pourquoi, combien de temps nous les conservons et comment exercer vos droits.",
  path: "/confidentialite",
});

export default async function ConfidentialitePage() {
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";

  return (
    <LegalLayout
      title="Politique de confidentialité"
      updatedAt="16 septembre 2026"
      intro="Cette politique explique quelles données personnelles nous traitons, pour quelles raisons, combien de temps nous les conservons et comment exercer vos droits. Elle est rédigée conformément au règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés."
    >
      <LegalSection id="responsable" title="1. Qui est responsable du traitement">
        <p>
          Le responsable du traitement est l&apos;éditeur du site, identifié
          dans les <a href="/mentions-legales">mentions légales</a>. Pour toute
          question relative à vos données, écrivez à{" "}
          <a href={`mailto:${contact}`}>{contact}</a>.
        </p>
        <p>
          Aucun délégué à la protection des données n&apos;a été désigné à ce
          jour, la désignation n&apos;étant pas obligatoire au regard de
          l&apos;activité. Cette information sera mise à jour si la situation
          évolue.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="2. Quelles données et pour quoi faire">
        <p>
          Nous appliquons le principe de minimisation : seules les données
          nécessaires à chaque finalité sont collectées.
        </p>
        <table>
          <thead>
            <tr>
              <th>Finalité</th>
              <th>Données</th>
              <th>Base légale</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestion des commandes et des livraisons</td>
              <td>
                Identité, adresses de livraison et de facturation, courriel,
                téléphone, contenu de la commande
              </td>
              <td>Exécution du contrat (art. 6.1.b)</td>
              <td>
                Durée de la relation commerciale, puis 5 ans (prescription
                commerciale)
              </td>
            </tr>
            <tr>
              <td>Facturation et comptabilité</td>
              <td>Identité, adresse de facturation, montants, factures</td>
              <td>Obligation légale (art. 6.1.c)</td>
              <td>10 ans (art. L123-22 du code de commerce)</td>
            </tr>
            <tr>
              <td>Paiement</td>
              <td>
                Référence de transaction, statut, marque et 4 derniers chiffres
                de la carte
              </td>
              <td>Exécution du contrat</td>
              <td>13 mois pour la preuve de transaction</td>
            </tr>
            <tr>
              <td>Compte client</td>
              <td>
                Courriel, mot de passe chiffré, adresses enregistrées,
                historique, favoris
              </td>
              <td>Exécution du contrat</td>
              <td>
                Jusqu&apos;à suppression du compte, ou 3 ans sans connexion
              </td>
            </tr>
            <tr>
              <td>Demandes de devis et projets sur mesure</td>
              <td>
                Identité, coordonnées, configuration du projet, échanges et
                pièces jointes
              </td>
              <td>Mesures précontractuelles (art. 6.1.b)</td>
              <td>3 ans à compter du dernier échange, sans commande</td>
            </tr>
            <tr>
              <td>Newsletter</td>
              <td>Courriel, preuve de consentement</td>
              <td>Consentement (art. 6.1.a)</td>
              <td>
                Jusqu&apos;au retrait du consentement, puis 3 ans pour la preuve
              </td>
            </tr>
            <tr>
              <td>Mesure d&apos;audience</td>
              <td>
                Pages consultées, référent, type d&apos;appareil, identifiant
                journalier haché
              </td>
              <td>Consentement</td>
              <td>13 mois maximum</td>
            </tr>
            <tr>
              <td>Sécurité du site</td>
              <td>
                Adresse IP hachée, journal des connexions et des actions
                d&apos;administration
              </td>
              <td>Intérêt légitime (art. 6.1.f)</td>
              <td>12 mois</td>
            </tr>
          </tbody>
        </table>
      </LegalSection>

      <LegalSection id="paiement" title="3. Données bancaires">
        <p>
          <strong className="text-foreground">
            Aucun numéro de carte bancaire n&apos;est saisi ni conservé sur ce
            site.
          </strong>{" "}
          La saisie a lieu sur les pages sécurisées de notre prestataire de
          paiement, qui est seul à traiter ces données en qualité de
          responsable de traitement pour cette opération. Nous ne recevons
          qu&apos;une référence de transaction, son statut et, le cas échéant,
          la marque et les quatre derniers chiffres de la carte.
        </p>
      </LegalSection>

      <LegalSection id="destinataires" title="4. Qui accède à vos données">
        <p>
          Vos données sont accessibles à l&apos;atelier et, dans la limite de
          ce qui est nécessaire, aux prestataires suivants, agissant comme
          sous-traitants au sens de l&apos;article 28 du RGPD :
        </p>
        <ul>
          <li>
            <strong>Hébergement du site :</strong> Vercel Inc. — serveurs
            situés dans l&apos;Union européenne.
          </li>
          <li>
            <strong>Base de données :</strong> hébergeur PostgreSQL au sein de
            l&apos;Union européenne.
          </li>
          <li>
            <strong>Paiement :</strong> Stripe Payments Europe Ltd. et PayPal
            (Europe) S.à r.l. et Cie, S.C.A.
          </li>
          <li>
            <strong>Courriels transactionnels :</strong> Resend.
          </li>
          <li>
            <strong>Transporteurs :</strong> destinataires des seules données
            nécessaires à la livraison.
          </li>
          <li>
            <strong>Stockage des médias :</strong> Cloudflare R2 ou Supabase
            Storage.
          </li>
        </ul>
        <p>
          Chaque prestataire est lié par un contrat encadrant le traitement et
          n&apos;est autorisé à agir que sur instruction. Vos données ne sont
          ni vendues ni louées.
        </p>
        <p>
          Lorsqu&apos;un transfert hors de l&apos;Union européenne est
          nécessaire, il s&apos;appuie sur les clauses contractuelles types
          adoptées par la Commission européenne ou sur une décision
          d&apos;adéquation. La liste à jour des prestataires concernés peut
          être obtenue sur simple demande.
        </p>
      </LegalSection>

      <LegalSection id="droits" title="5. Vos droits">
        <p>Vous disposez des droits suivants :</p>
        <ul>
          <li>
            <strong>Accès :</strong> obtenir la confirmation qu&apos;un
            traitement existe et en recevoir une copie.
          </li>
          <li>
            <strong>Rectification :</strong> faire corriger une donnée inexacte
            ou incomplète.
          </li>
          <li>
            <strong>Effacement :</strong> demander la suppression de vos
            données, sous réserve des obligations légales de conservation —
            une facture, par exemple, ne peut pas être supprimée avant dix ans.
          </li>
          <li>
            <strong>Limitation :</strong> demander le gel d&apos;un traitement
            contesté.
          </li>
          <li>
            <strong>Opposition :</strong> vous opposer à un traitement fondé
            sur l&apos;intérêt légitime, ou à la prospection, à tout moment et
            sans justification.
          </li>
          <li>
            <strong>Portabilité :</strong> recevoir dans un format structuré
            les données que vous nous avez fournies, pour les transmettre à un
            autre responsable de traitement.
          </li>
          <li>
            <strong>Directives post mortem :</strong> définir le sort de vos
            données après votre décès.
          </li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez à{" "}
          <a href={`mailto:${contact}`}>{contact}</a> ou utilisez le{" "}
          <a href="/contact">formulaire de contact</a>. Nous répondons dans un
          délai d&apos;un mois à compter de la réception, prolongeable de deux
          mois en cas de demande complexe — vous en seriez alors informé. Un
          justificatif d&apos;identité pourra être demandé en cas de doute
          raisonnable sur l&apos;identité du demandeur ; il est détruit dès la
          vérification faite.
        </p>
        <p>
          Si la réponse ne vous satisfait pas, vous pouvez introduire une
          réclamation auprès de la Commission nationale de l&apos;informatique
          et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris
          Cedex 07 —{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            www.cnil.fr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="securite" title="6. Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          adaptées : chiffrement des échanges (HTTPS), mots de passe stockés
          sous forme de condensats, double authentification pour
          l&apos;administration, gestion des rôles et des habilitations,
          limitation des tentatives de connexion, journalisation des actions
          sensibles, sauvegardes chiffrées et mises à jour régulières des
          composants.
        </p>
        <p>
          Aucun système n&apos;est parfaitement invulnérable. Nous maintenons
          un effort continu de mise à jour et de surveillance. En cas de
          violation de données susceptible d&apos;engendrer un risque élevé
          pour vos droits, vous en seriez informé, et la CNIL notifiée dans les
          72 heures conformément aux articles 33 et 34 du RGPD.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies">
        <p>
          L&apos;usage des traceurs est détaillé dans la{" "}
          <a href="/cookies">politique de cookies</a>, depuis laquelle vous
          pouvez à tout moment modifier ou retirer votre consentement.
        </p>
      </LegalSection>

      <LegalSection id="modifications" title="8. Modifications">
        <p>
          Cette politique peut évoluer. En cas de changement substantiel, la
          date de mise à jour est modifiée et, si le traitement repose sur
          votre consentement, celui-ci vous est à nouveau demandé.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
