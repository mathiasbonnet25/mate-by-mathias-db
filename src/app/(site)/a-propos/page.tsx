import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube } from "lucide-react";

import { PageIntro } from "@/components/shop/page-intro";
import { Section } from "@/components/ui/section";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getContent, text } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const revalidate = 600;

export const metadata = buildMetadata({
  title: "À propos",
  description:
    "L'histoire de l'atelier Mate by Mathias, le parcours, la méthode de travail et les réalisations.",
  path: "/a-propos",
});

const PHILOSOPHIE = [
  {
    title: "Le temps qu'il faut",
    body: "Une peinture réussie se joue à la préparation. Décaper, reprendre, apprêter, poncer : c'est long, invisible sur la photo, et c'est pourtant ce qui fait tenir le résultat dix ans.",
  },
  {
    title: "Une pièce à la fois",
    body: "Pas de série, pas de sous-traitance. Chaque cadre passe entre mes mains du début à la fin, ce qui limite le nombre de projets mais garantit le niveau de finition.",
  },
  {
    title: "Votre projet, pas le mien",
    body: "Je propose, je conseille, je dis quand une idée ne tiendra pas techniquement. Mais la pièce est la vôtre : c'est votre vélo qui doit vous ressembler.",
  },
];

async function loadGallery() {
  try {
    return await prisma.mediaAsset.findMany({
      where: { folder: "/atelier", mimeType: { startsWith: "image/" } },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch {
    return [];
  }
}

export default async function AProposPage() {
  const content = await getContent();
  const gallery = await loadGallery();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Accueil", path: "/" },
              { name: "À propos", path: "/a-propos" },
            ]),
          ),
        }}
      />

      <PageIntro
        eyebrow="La maison"
        title={text(content, "about.title")}
        description={text(content, "about.body")}
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "À propos", path: "/a-propos" },
        ]}
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <Reveal>
            <p className="eyebrow">Le parcours</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.1]">
              De la passion au métier
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-5 text-[15px] leading-[1.9] text-foreground-muted">
              <p>
                J&apos;ai commencé par réparer mes propres vélos, puis ceux des
                copains. Un cadre rayé à repeindre, un vieux modèle retrouvé
                dans un garage, une teinte impossible à trouver dans le
                commerce : de fil en aiguille, l&apos;habitude est devenue un
                métier.
              </p>
              <p>
                J&apos;ai appris la préparation des surfaces, le travail en
                cabine, les peintures à effets et les vernis. Chaque projet
                apporte sa contrainte — un tube fin, une patte de dérailleur
                fragile, un logo à reproduire au dixième de millimètre — et
                c&apos;est précisément ce qui rend le travail intéressant.
              </p>
              <p>
                Aujourd&apos;hui, l&apos;atelier reçoit des cadres de toute la
                France. Certains repartent dans leur teinte d&apos;origine,
                restaurés à l&apos;identique. D&apos;autres deviennent des
                pièces uniques, dessinées avec leur propriétaire.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section muted eyebrow="Philosophie" title="Trois principes, jamais négociés">
        <div className="grid gap-10 md:grid-cols-3">
          {PHILOSOPHIE.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <span className="block h-px w-12 bg-accent" />
              <h3 className="mt-6 font-display text-2xl">{item.title}</h3>
              <p className="mt-4 text-[14px] leading-[1.85] text-foreground-muted">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {gallery.length > 0 && (
        <Section eyebrow="Réalisations" title="L'atelier en images">
          <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((asset) => (
              <div
                key={asset.id}
                className="relative aspect-square overflow-hidden bg-surface-muted"
              >
                <Image
                  src={asset.webpUrl ?? asset.url}
                  alt={asset.alt ?? "Réalisation de l'atelier"}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
                />
              </div>
            ))}
          </RevealGroup>
        </Section>
      )}

      <Section muted className="text-center">
        <Reveal>
          <p className="eyebrow">Suivre l&apos;atelier</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance font-display text-4xl leading-[1.1] md:text-5xl">
            Les projets en cours, presque en direct
          </h2>

          <div className="mt-10 flex items-center justify-center gap-4">
            {[
              { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
              { label: "Facebook", href: "https://facebook.com", Icon: Facebook },
              { label: "YouTube", href: "https://youtube.com", Icon: Youtube },
            ].map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-12 w-12 place-items-center border border-line transition-colors hover:border-accent hover:text-accent"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/personnalisation" size="lg">
              Composer mon projet
            </ButtonLink>
            <Link
              href="/contact"
              className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted transition-colors hover:text-accent"
            >
              Me contacter
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
