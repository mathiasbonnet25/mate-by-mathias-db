import { PageIntro } from "@/components/shop/page-intro";
import { Reveal } from "@/components/ui/reveal";
import { prisma } from "@/lib/prisma";
import { buildMetadata, faqJsonLd, jsonLdScript } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Questions fréquentes",
  description:
    "Délais, entretien d'une peinture, tailles de cadre, livraison, garanties : les réponses aux questions les plus courantes.",
  path: "/faq",
});

/** Questions par défaut, servies tant que l'administration n'en a pas saisi. */
const DEFAULT_FAQ = [
  {
    category: "Atelier",
    question: "Combien de temps dure un projet de peinture ?",
    answer:
      "Comptez trois à six semaines pour un cadre, selon la complexité et la charge de l'atelier. Une peinture unie va plus vite qu'un candy à plusieurs voiles ou qu'un travail de masquage important. Le délai exact figure sur le devis et je vous préviens dès que la pièce entre en cabine.",
  },
  {
    category: "Atelier",
    question: "Dois-je démonter mon vélo avant de l'envoyer ?",
    answer:
      "Idéalement oui : un cadre nu, sans roulement de direction ni boîtier, arrive prêt à travailler et évite des frais de démontage. Si vous préférez envoyer le vélo complet, c'est possible : le démontage et le remontage sont alors chiffrés sur le devis.",
  },
  {
    category: "Atelier",
    question: "Pouvez-vous reproduire les logos d'origine ?",
    answer:
      "Dans la plupart des cas, oui, à condition que cela reste une restauration à l'identique de votre propre cadre. Je ne reproduis pas les marques d'un fabricant sur un cadre qui n'en provient pas.",
  },
  {
    category: "Entretien",
    question: "Comment entretenir une peinture neuve ?",
    answer:
      "Attendez trois semaines avant tout nettoyage appuyé : le vernis finit de durcir. Ensuite, eau tiède et savon doux, chiffon microfibre. Évitez le nettoyeur haute pression sur les arêtes, les dégraissants agressifs et le stationnement prolongé en plein soleil.",
  },
  {
    category: "Boutique",
    question: "Quelle taille de cadre choisir ?",
    answer:
      "La taille dépend de votre entrejambe, de votre pratique et de votre souplesse. Le guide des tailles donne une première indication ; en cas de doute, écrivez-moi avec vos mesures et votre pratique, je vous oriente.",
  },
  {
    category: "Commandes",
    question: "Quels sont les délais de livraison ?",
    answer:
      "Les articles en stock partent sous 48 heures ouvrées et arrivent en 2 à 4 jours ouvrés en France métropolitaine. Les pièces peintes sont expédiées à l'issue des travaux, dans le délai annoncé au devis.",
  },
  {
    category: "Commandes",
    question: "Puis-je retourner un article ?",
    answer:
      "Oui, vous disposez de 14 jours après réception pour les articles du catalogue. En revanche, une pièce peinte selon vos spécifications est un bien nettement personnalisé : le droit de rétractation ne s'y applique pas, conformément à l'article L221-28 du code de la consommation.",
  },
  {
    category: "Commandes",
    question: "Le paiement est-il sécurisé ?",
    answer:
      "La saisie de la carte se fait sur les pages de notre prestataire de paiement : aucun numéro de carte ne transite ni n'est conservé sur ce site. Carte bancaire, PayPal, Apple Pay et Google Pay sont acceptés.",
  },
];

async function loadFaq() {
  try {
    const items = await prisma.faqItem.findMany({
      where: { isPublished: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    });
    if (items.length === 0) return DEFAULT_FAQ;
    return items.map((item) => ({
      category: item.category,
      question: item.question,
      answer: item.answer,
    }));
  } catch {
    return DEFAULT_FAQ;
  }
}

export default async function FaqPage() {
  const items = await loadFaq();

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            faqJsonLd(
              items.map((i) => ({ question: i.question, answer: i.answer })),
            ),
          ),
        }}
      />

      <PageIntro
        eyebrow="Aide"
        title="Questions fréquentes"
        description="Si vous ne trouvez pas votre réponse ici, écrivez-moi : je réponds sous deux jours ouvrés."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Questions fréquentes", path: "/faq" },
        ]}
      />

      <div className="container-page pb-28">
        <div className="max-w-3xl space-y-16">
          {Object.entries(grouped).map(([category, entries]) => (
            <Reveal key={category}>
              <h2 className="eyebrow">{category}</h2>
              <dl className="mt-6 divide-y divide-[var(--border)] border-y border-line">
                {entries.map((item) => (
                  <div key={item.question} className="py-7">
                    <dt className="font-display text-xl">{item.question}</dt>
                    <dd className="mt-3 text-[15px] leading-[1.85] text-foreground-muted">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
