import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { CookiePreferencesButton } from "@/components/legal/cookie-consent";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, COOKIE_POLICY_VERSION } from "@/lib/consent";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Politique de cookies",
  description:
    "Quels cookies et traceurs sont utilisés sur le site, dans quel but, et comment modifier ou retirer votre consentement.",
  path: "/cookies",
});

/** Traceurs déclarés dans l'administration, groupés par catégorie. */
async function loadTrackers() {
  try {
    return await prisma.cookieCategory.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      include: {
        trackers: { where: { isActive: true }, orderBy: { name: "asc" } },
      },
    });
  } catch {
    return [];
  }
}

export default async function CookiesPage() {
  const categories = await loadTrackers();

  return (
    <LegalLayout
      title="Politique de cookies"
      updatedAt="16 septembre 2026"
      intro={`Version ${COOKIE_POLICY_VERSION}. Cette page décrit les traceurs déposés sur votre appareil, leur finalité et la façon de les refuser. Aucun traceur soumis à consentement n'est déposé avant votre accord.`}
    >
      <LegalSection id="principes" title="1. Nos principes">
        <ul>
          <li>
            Aucun cookie soumis à consentement n&apos;est déposé avant un acte
            positif de votre part. La simple poursuite de la navigation ne vaut
            pas acceptation.
          </li>
          <li>
            Refuser est aussi simple qu&apos;accepter : les deux boutons ont la
            même taille, le même poids visuel et demandent un seul clic.
          </li>
          <li>
            Aucune case n&apos;est pré-cochée, aucun consentement n&apos;est
            forcé, aucun contenu n&apos;est rendu inaccessible en cas de refus,
            hors contenus externes qui en dépendent techniquement.
          </li>
          <li>
            Votre choix est conservé six mois, puis vous est à nouveau demandé.
            Vous pouvez le modifier à tout moment.
          </li>
          <li>
            Une preuve horodatée de votre choix est conservée, sans adresse IP
            en clair.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="categories" title="2. Les catégories utilisées">
        {(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map(
          (key) => {
            const meta = CATEGORY_LABELS[key];
            return (
              <div key={key}>
                <h3>
                  {meta.name}
                  {meta.essential && " — exempt de consentement"}
                </h3>
                <p>{meta.description}</p>
              </div>
            );
          },
        )}
        <p>
          Les cookies strictement nécessaires — panier, session
          d&apos;authentification, protection des formulaires, mémorisation de
          votre choix de cookies — sont exemptés de consentement au titre de
          l&apos;article 82 de la loi Informatique et Libertés, car ils sont
          indispensables à la fourniture du service que vous demandez.
        </p>
      </LegalSection>

      {categories.length > 0 && (
        <LegalSection id="liste" title="3. Liste détaillée des traceurs">
          {categories.map((category) => (
            <div key={category.id}>
              <h3>{category.name}</h3>
              {category.trackers.length === 0 ? (
                <p>Aucun traceur actif dans cette catégorie.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Émetteur</th>
                      <th>Finalité</th>
                      <th>Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.trackers.map((tracker) => (
                      <tr key={tracker.id}>
                        <td>{tracker.name}</td>
                        <td>
                          {tracker.vendor}
                          {tracker.recipientCountry
                            ? ` (${tracker.recipientCountry})`
                            : ""}
                        </td>
                        <td>{tracker.purpose}</td>
                        <td>{tracker.retention ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </LegalSection>
      )}

      <LegalSection id="choix" title="4. Modifier ou retirer votre choix">
        <p>
          Vous pouvez à tout moment revenir sur votre décision, aussi
          facilement que vous l&apos;avez donnée :
        </p>
        <p>
          <CookiePreferencesButton className="rounded-full inline-flex h-12 items-center border border-accent px-7 text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent hover:text-accent-contrast" />
        </p>
        <p>
          Vous pouvez également configurer votre navigateur pour refuser ou
          supprimer les cookies. Attention : le blocage des cookies strictement
          nécessaires empêche le fonctionnement du panier et de la connexion à
          votre compte.
        </p>
      </LegalSection>

      <LegalSection id="tiers" title="5. Services tiers intégrés">
        <p>
          Certains contenus proviennent de services externes qui déposent leurs
          propres traceurs : galerie Instagram, vidéos, cartes. Ils ne sont
          chargés qu&apos;après acceptation de la catégorie « contenus
          externes ». Tant que vous n&apos;avez pas consenti, un substitut
          explicite est affiché à leur place.
        </p>
        <p>
          Les outils de paiement (Stripe, PayPal) déposent des traceurs
          strictement nécessaires à la sécurisation de la transaction et à la
          prévention de la fraude au moment du règlement.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="6. Questions">
        <p>
          Pour toute question sur les traceurs ou sur le traitement de vos
          données, consultez la{" "}
          <a href="/confidentialite">politique de confidentialité</a> ou
          écrivez-nous depuis la <a href="/contact">page de contact</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
