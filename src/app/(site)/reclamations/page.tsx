import Link from "next/link";

import { PageIntro } from "@/components/shop/page-intro";
import { ClaimForm } from "@/components/legal/claim-form";
import { Reveal } from "@/components/ui/reveal";
import { auth } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Réclamations et litiges",
  description:
    "Comment signaler un problème sur une commande ou une prestation, quels délais s'appliquent, et quels recours existent en cas de désaccord.",
  path: "/reclamations",
});

const ETAPES = [
  {
    titre: "Vous déposez votre demande",
    texte:
      "Le formulaire ci-dessous ouvre un dossier portant un numéro. Décrivez ce que vous avez constaté et joignez des photos : elles évitent presque toujours un aller-retour.",
  },
  {
    titre: "Nous accusons réception",
    texte:
      "Sous 48 heures ouvrées, vous recevez un courriel confirmant l'ouverture du dossier et son numéro. Répondez-y pour ajouter un document.",
  },
  {
    titre: "Nous étudions le dossier",
    texte:
      "Nous examinons les éléments et pouvons vous demander une précision, une photo supplémentaire ou le retour de la pièce.",
  },
  {
    titre: "Nous vous proposons une solution",
    texte:
      "Réparation, remplacement, remboursement ou geste commercial, selon la nature du problème et les garanties applicables. Une réponse motivée vous parvient sous quinze jours au plus tard.",
  },
];

export default async function ReclamationsPage() {
  const session = await auth();
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";

  return (
    <>
      <PageIntro
        eyebrow="Aide"
        title="Un problème sur votre commande ?"
        description="Signalez-le ici. Chaque demande ouvre un dossier suivi, avec un numéro et une réponse motivée. Aucun message n'est laissé sans suite."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Réclamations", path: "/reclamations" },
        ]}
      />

      <div className="container-page pb-28">
        {/* Déroulé de la procédure */}
        <Reveal>
          <ol className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {ETAPES.map((etape, i) => (
              <li key={etape.titre}>
                <span className="font-display text-5xl text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-4 font-display text-xl">{etape.titre}</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-foreground-muted">
                  {etape.texte}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
          <Reveal>
            <ClaimForm defaultEmail={session?.user?.email} />
          </Reveal>

          <Reveal delay={0.1}>
            <aside className="space-y-8">
              <div className="card-soft p-7">
                <h2 className="eyebrow">Avant de déposer</h2>
                <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-foreground-muted">
                  <li>
                    <strong className="text-foreground">Colis abîmé ?</strong>{" "}
                    Portez des réserves précises sur le bordereau du
                    transporteur, devant le livreur. La mention « sous réserve
                    de déballage » n&apos;a aucune valeur juridique.
                  </li>
                  <li>
                    <strong className="text-foreground">Vous changez d&apos;avis ?</strong>{" "}
                    Ce n&apos;est pas une réclamation mais une rétractation :
                    voir la page{" "}
                    <Link href="/retractation" className="underline hover:text-accent">
                      droit de rétractation
                    </Link>
                    .
                  </li>
                  <li>
                    <strong className="text-foreground">Défaut apparu à l&apos;usage ?</strong>{" "}
                    Les{" "}
                    <Link href="/garanties" className="underline hover:text-accent">
                      garanties légales
                    </Link>{" "}
                    s&apos;appliquent pendant deux ans, gratuitement.
                  </li>
                </ul>
              </div>

              <div className="card-soft p-7">
                <h2 className="eyebrow">Si nous ne trouvons pas d&apos;accord</h2>
                <p className="mt-4 text-[13px] leading-relaxed text-foreground-muted">
                  Vous pouvez recourir gratuitement à un médiateur de la
                  consommation, dans un délai d&apos;un an à compter de votre
                  réclamation écrite (articles L612-1 et suivants du code de la
                  consommation).
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-foreground-muted">
                  Les coordonnées du médiateur retenu par l&apos;atelier
                  figurent à l&apos;article 11 des{" "}
                  <Link href="/cgv" className="underline hover:text-accent">
                    conditions générales de vente
                  </Link>
                  .
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-foreground-muted">
                  La plateforme européenne de règlement en ligne des litiges est
                  accessible à l&apos;adresse{" "}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-accent"
                  >
                    ec.europa.eu/consumers/odr
                  </a>
                  .
                </p>
              </div>

              <div className="card-soft p-7">
                <h2 className="eyebrow">Nous joindre directement</h2>
                <a
                  href={`mailto:${contact}`}
                  className="mt-4 block text-sm transition-colors hover:text-accent"
                >
                  {contact}
                </a>
                {c["contact.phone"] && (
                  <a
                    href={`tel:${c["contact.phone"].replace(/\s/g, "")}`}
                    className="mt-2 block text-sm transition-colors hover:text-accent"
                  >
                    {c["contact.phone"]}
                  </a>
                )}
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </>
  );
}
