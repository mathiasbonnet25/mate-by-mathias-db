import { Configurator } from "@/components/atelier/configurator";
import { PageIntro } from "@/components/shop/page-intro";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

import { getCustomizationOptions } from "@/lib/customization";
import { breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Atelier personnalisation",
  description:
    "Composez votre projet de peinture sur mesure : pièce, type de peinture, finition et options. Estimation immédiate, puis devis personnalisé après étude.",
  path: "/personnalisation",
});

const ETAPES = [
  {
    title: "Étude",
    body: "Nous échangeons sur votre projet, les teintes, les références et le résultat recherché.",
  },
  {
    title: "Préparation",
    body: "Décapage, dégraissage, reprise des défauts, apprêt. C'est l'étape la plus longue, et la plus déterminante.",
  },
  {
    title: "Peinture",
    body: "Mise en teinte par couches successives, masquages et effets, en cabine.",
  },
  {
    title: "Vernis et finition",
    body: "Vernis, temps de séchage, polissage, contrôle. La pièce ne repart qu'une fois irréprochable.",
  },
];

export default async function PersonnalisationPage() {
  const options = await getCustomizationOptions();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Accueil", path: "/" },
              { name: "Atelier personnalisation", path: "/personnalisation" },
            ]),
          ),
        }}
      />

      <PageIntro
        eyebrow="Atelier"
        title="Composez votre projet"
        description="Quatre étapes pour dessiner les grandes lignes de votre peinture sur mesure. L'estimation se met à jour à chaque choix. Elle ne remplace pas le devis, établi après étude de la pièce."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Atelier personnalisation", path: "/personnalisation" },
        ]}
      />

      <div className="container-page pb-28">
        <Configurator options={options} />
      </div>

      <Section muted eyebrow="Méthode" title="Comment se déroule un projet">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((etape, index) => (
            <Reveal key={etape.title} delay={index * 0.08}>
              <p className="font-display text-5xl text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 font-display text-2xl">{etape.title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-foreground-muted">
                {etape.body}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-16 rounded-lg border border-line p-8 text-[13px] leading-relaxed text-foreground-muted">
            <p>
              <strong className="text-foreground">Bon à savoir.</strong> Une
              pièce peinte selon vos spécifications est un bien confectionné
              sur demande : conformément à l&apos;article L221-28, 3° du code de
              la consommation, le droit de rétractation de 14 jours ne
              s&apos;applique pas à ces prestations. Les délais, les modalités
              de règlement et les conditions d&apos;annulation sont précisés sur
              le devis, que vous acceptez avant tout commencement des travaux.
            </p>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
