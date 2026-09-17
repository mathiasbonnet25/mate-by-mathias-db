import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { PageIntro } from "@/components/shop/page-intro";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getContent } from "@/lib/content";
import { buildMetadata, faqJsonLd, jsonLdScript } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Comment ça marche",
  description:
    "Acheter un produit, utiliser le panier, suivre une commande, envoyer un projet de peinture personnalisée, comprendre la différence entre une estimation et un devis.",
  path: "/comment-ca-marche",
});

const ACHAT = [
  {
    titre: "Choisir",
    texte:
      "Chaque fiche produit indique le prix TTC, la disponibilité et le délai d'expédition. Si l'article existe en plusieurs couleurs ou tailles, sélectionnez la vôtre : les photos, le prix et le stock affichés correspondent alors exactement à cette variante.",
  },
  {
    titre: "Ajouter au panier",
    texte:
      "Le panier vous suit d'une visite à l'autre pendant trente jours, même sans compte. Vous pouvez y modifier les quantités, retirer un article et saisir un code promotionnel. Les frais de livraison y sont estimés ; leur montant définitif dépend de l'adresse.",
  },
  {
    titre: "Passer commande",
    texte:
      "Vous saisissez vos coordonnées et votre adresse, puis un récapitulatif vous permet de corriger toute erreur avant de payer. L'acceptation des conditions générales de vente est demandée explicitement.",
  },
  {
    titre: "Payer",
    texte:
      "Le paiement se fait sur la page sécurisée de notre prestataire : carte bancaire, PayPal, Apple Pay ou Google Pay. Aucun numéro de carte n'est saisi ni conservé sur ce site.",
  },
  {
    titre: "Suivre",
    texte:
      "Vous recevez une confirmation par courriel, puis un message à l'expédition avec le numéro de suivi. Depuis votre compte, vous retrouvez l'historique, les étapes de production et vos factures.",
  },
];

const ATELIER = [
  {
    titre: "Composer votre projet",
    texte:
      "L'atelier de personnalisation vous fait choisir la pièce, le type de peinture, la finition et les options. À chaque choix, l'estimation se met à jour.",
  },
  {
    titre: "Envoyer la demande",
    texte:
      "Vous laissez vos coordonnées et décrivez votre projet : marque et modèle du cadre, teintes souhaitées, références visuelles, délai idéal. Plus c'est précis, plus le devis sera juste.",
  },
  {
    titre: "Recevoir un devis",
    texte:
      "Nous étudions le projet et revenons vers vous sous trois jours ouvrés avec un devis écrit, daté, mentionnant le prix, le délai et les conditions de règlement.",
  },
  {
    titre: "Valider et lancer",
    texte:
      "Les travaux ne démarrent qu'après votre acceptation du devis. Un acompte peut être demandé ; il est alors indiqué sur le devis.",
  },
];

const QUESTIONS = [
  {
    question: "Quelle est la différence entre l'estimation et le devis ?",
    answer:
      "L'estimateur calcule un ordre de grandeur à partir d'un barème : support, type de peinture, finition, options. Il ne voit pas votre pièce. Le devis, lui, est établi après étude réelle du projet : état du cadre, complexité des masquages, nature des effets. Seul le devis écrit et accepté engage les deux parties.",
  },
  {
    question: "Puis-je modifier ma commande après paiement ?",
    answer:
      "Pour un article du catalogue non encore expédié, écrivez-nous immédiatement : nous faisons le nécessaire si le colis n'est pas parti. Pour une prestation de peinture, toute modification doit nous parvenir avant le lancement des travaux, dont la date vous est communiquée.",
  },
  {
    question: "Puis-je annuler ?",
    answer:
      "Un article du catalogue peut être retourné dans les quatorze jours suivant la réception. Une prestation de peinture personnalisée n'ouvre pas droit à rétractation, mais son annulation avant démarrage des travaux est possible selon les conditions du devis.",
  },
  {
    question: "Comment sont traitées les réclamations ?",
    answer:
      "Chaque demande ouvre un dossier numéroté. Nous accusons réception sous quarante-huit heures ouvrées et apportons une réponse motivée sous quinze jours au plus tard. En cas de désaccord persistant, vous pouvez recourir gratuitement à un médiateur de la consommation.",
  },
];

export default async function CommentCaMarchePage() {
  const c = await getContent();
  const contact = c["contact.email"] ?? "contact@matebymathias.fr";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd(QUESTIONS)) }}
      />

      <PageIntro
        eyebrow="Aide"
        title="Comment ça marche"
        description="Acheter une pièce, composer un projet de peinture, suivre une commande, signaler un problème. Tout est expliqué ici, sans détour."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Comment ça marche", path: "/comment-ca-marche" },
        ]}
      />

      <Section
        eyebrow="Boutique"
        title="Acheter un produit"
        curve="muted"
      >
        <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {ACHAT.map((etape, i) => (
            <Reveal key={etape.titre} delay={i * 0.06} as="li">
              <span className="font-display text-5xl text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-2xl">{etape.titre}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground-muted">
                {etape.texte}
              </p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section muted eyebrow="Atelier" title="Un projet de peinture sur mesure">
        <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {ATELIER.map((etape, i) => (
            <Reveal key={etape.titre} delay={i * 0.06} as="li">
              <span className="font-display text-5xl text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-2xl">{etape.titre}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground-muted">
                {etape.texte}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={0.2}>
          <div className="mt-14 flex max-w-3xl gap-4 rounded-lg border border-accent/40 bg-accent/[0.06] p-7">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-[15px] leading-relaxed">
                Le montant indiqué par l&apos;estimateur est une estimation. Il
                ne constitue pas un devis définitif. Un devis personnalisé
                pourra être établi après étude de votre projet.
              </p>
              <ButtonLink
                href="/personnalisation"
                variant="outline"
                size="sm"
                className="mt-6"
              >
                Composer mon projet
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section eyebrow="Questions" title="Modifier, annuler, réclamer">
        <div className="max-w-3xl">
          <dl className="divide-y divide-[var(--border)] border-y border-line">
            {QUESTIONS.map((q) => (
              <div key={q.question} className="py-7">
                <dt className="font-display text-xl">{q.question}</dt>
                <dd className="mt-3 text-[15px] leading-[1.85] text-foreground-muted">
                  {q.answer}
                </dd>
              </div>
            ))}
          </dl>

          <Reveal>
            <div className="card-soft mt-12 p-8">
              <h2 className="font-display text-2xl">Un souci ? Écrivez-nous.</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground-muted">
                Le plus simple est d&apos;ouvrir un dossier depuis la page{" "}
                <Link href="/reclamations" className="underline hover:text-accent">
                  réclamations
                </Link>{" "}
                : vous obtenez un numéro et un suivi. Vous pouvez aussi écrire
                directement à{" "}
                <a href={`mailto:${contact}`} className="underline hover:text-accent">
                  {contact}
                </a>
                .
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/reclamations" size="sm">
                  Ouvrir un dossier
                </ButtonLink>
                <ButtonLink href="/informations-legales" variant="outline" size="sm">
                  Informations légales
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
