import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageIntro } from "@/components/shop/page-intro";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Informations légales",
  description:
    "Tous les documents juridiques de Mate by Mathias : mentions légales, conditions générales de vente, confidentialité, cookies, livraison, retours, garanties, rétractation et médiation.",
  path: "/informations-legales",
});

/** Les documents, groupés par ce que la personne cherche à faire. */
const RUBRIQUES = [
  {
    titre: "Avant d'acheter",
    documents: [
      {
        href: "/cgv",
        nom: "Conditions générales de vente",
        resume:
          "Le contrat qui nous lie : commande, prix, paiement, livraison, garanties et litiges.",
      },
      {
        href: "/livraison",
        nom: "Livraison",
        resume:
          "Tarifs, délais, zones desservies, emballage des cadres et marche à suivre en cas de colis abîmé.",
      },
      {
        href: "/comment-ca-marche",
        nom: "Comment ça marche",
        resume:
          "Acheter, composer un projet de peinture, comprendre la différence entre estimation et devis.",
      },
    ],
  },
  {
    titre: "Après votre commande",
    documents: [
      {
        href: "/retractation",
        nom: "Droit de rétractation",
        resume:
          "Quatorze jours pour changer d'avis, les exceptions applicables aux pièces personnalisées, et le formulaire type.",
      },
      {
        href: "/retours-remboursements",
        nom: "Retours et remboursements",
        resume:
          "Dans quels cas un retour est possible, qui paie les frais, sous quel délai vous êtes remboursé.",
      },
      {
        href: "/garanties",
        nom: "Garanties et service après-vente",
        resume:
          "Garantie de conformité, vices cachés, durée, gratuité et mise en œuvre.",
      },
      {
        href: "/reclamations",
        nom: "Réclamations et litiges",
        resume:
          "Signaler un problème, suivre son dossier, et recourir à la médiation de la consommation.",
      },
    ],
  },
  {
    titre: "Vos données et ce site",
    documents: [
      {
        href: "/confidentialite",
        nom: "Politique de confidentialité",
        resume:
          "Quelles données nous traitons, pourquoi, combien de temps, qui y accède et comment exercer vos droits.",
      },
      {
        href: "/cookies",
        nom: "Politique de cookies",
        resume:
          "Les traceurs déposés, leur finalité, et comment modifier ou retirer votre consentement.",
      },
      {
        href: "/mentions-legales",
        nom: "Mentions légales",
        resume:
          "Qui édite ce site, qui l'héberge, et à qui vous adresser.",
      },
    ],
  },
];

export default function InformationsLegalesPage() {
  return (
    <>
      <PageIntro
        eyebrow="La maison"
        title="Informations légales"
        description="Tous les documents qui encadrent la vente, la livraison, vos droits et le traitement de vos données. Ils sont écrits pour être lus, pas pour décourager."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Informations légales", path: "/informations-legales" },
        ]}
      />

      <div className="container-page pb-28">
        <div className="space-y-20">
          {RUBRIQUES.map((rubrique) => (
            <section key={rubrique.titre}>
              <Reveal>
                <h2 className="font-display text-3xl">{rubrique.titre}</h2>
                <div className="rule-gold mt-6 max-w-[6rem]" />
              </Reveal>

              <RevealGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {rubrique.documents.map((doc) => (
                  <RevealItem key={doc.href} className="h-full">
                    <Link
                      href={doc.href}
                      className="card-soft card-soft-hover group flex h-full flex-col p-7"
                    >
                      <h3 className="font-display text-xl leading-snug transition-colors group-hover:text-accent">
                        {doc.nom}
                      </h3>
                      <p className="mt-3 flex-1 text-[13px] leading-relaxed text-foreground-muted">
                        {doc.resume}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-accent">
                        Lire
                        <ArrowUpRight
                          className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
          ))}
        </div>

        <Reveal>
          <div className="card-soft mt-20 p-8">
            <p className="text-[13px] leading-relaxed text-foreground-muted">
              <strong className="text-foreground">Avertissement.</strong> Ces
              documents constituent une base de travail. Ils doivent être relus,
              complétés avec les informations réelles de l&apos;entreprise et
              validés par un professionnel du droit avant la mise en ligne. Les
              champs non renseignés y sont signalés explicitement.
            </p>
          </div>
        </Reveal>
      </div>
    </>
  );
}
