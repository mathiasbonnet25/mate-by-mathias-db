import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/home/hero";
import { CategoryCards } from "@/components/home/category-cards";
import { Reviews, type ReviewData } from "@/components/home/reviews";
import { InstagramGrid } from "@/components/home/instagram-grid";
import { ProductCard } from "@/components/shop/product-card";
import { Section } from "@/components/ui/section";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";

import { getContent, text } from "@/lib/content";
import { getFeaturedProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Peinture et restauration de vélos sur mesure",
  description:
    "Atelier français de peinture personnalisée et de restauration de cadres de vélo. Projets sur mesure, vêtements et accessoires sélectionnés.",
  path: "/",
});

/** Charge les données de la page en tolérant une base indisponible. */
async function loadHomeData() {
  try {
    const [featured, reviews, instagram] = await Promise.all([
      getFeaturedProducts(4),
      prisma.review.findMany({
        where: { isPublished: true },
        orderBy: { collectedAt: "desc" },
        take: 3,
        include: { product: { select: { name: true } } },
      }),
      prisma.instagramPost.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        take: 6,
      }),
    ]);
    return { featured, reviews, instagram };
  } catch {
    return { featured: [], reviews: [], instagram: [] };
  }
}

export default async function HomePage() {
  const content = await getContent();
  const { featured, reviews, instagram } = await loadHomeData();

  const reviewData: ReviewData[] = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    collectedAt: r.collectedAt.toISOString(),
    isVerifiedPurchase: r.isVerifiedPurchase,
    productName: r.product?.name ?? null,
  }));

  return (
    <>
      <Hero
        eyebrow={text(content, "home.hero.eyebrow")}
        title={text(content, "home.hero.title")}
        subtitle={text(content, "home.hero.subtitle")}
        cta={text(content, "home.hero.cta")}
        videoUrl={text(content, "home.hero.video") || undefined}
        posterUrl={text(content, "home.hero.poster") || undefined}
      />

      {/* Présentation */}
      <Section id="presentation">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <Reveal>
            <p className="eyebrow">{text(content, "home.intro.eyebrow")}</p>
            <h2 className="mt-4 text-balance font-display text-4xl leading-[1.1] md:text-5xl">
              {text(content, "home.intro.title")}
            </h2>
            <div className="rule-gold mt-9 max-w-[8rem]" />
          </Reveal>

          <Reveal delay={0.12}>
            <p className="text-base leading-[1.85] text-foreground-muted">
              {text(content, "home.intro.body")}
            </p>

            <dl className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                { term: "Peinture", detail: "Unie, métallisée, candy, caméléon, chrome" },
                { term: "Restauration", detail: "Décapage, redressage, remise à neuf" },
                { term: "Sur mesure", detail: "Du projet dessiné au montage complet" },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-accent">
                    {item.term}
                  </dt>
                  <dd className="mt-2 text-[13px] leading-relaxed text-foreground-muted">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href="/a-propos"
              className="group mt-12 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-accent"
            >
              Découvrir l&apos;atelier
              <ArrowRight
                className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5"
                aria-hidden
              />
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* Catégories */}
      <Section muted title={text(content, "home.categories.title")}>
        <RevealGroup>
          <CategoryCards
            cards={[
              {
                title: "Cadres & Vélos",
                description:
                  "Cadres nus, vélos complets et pièces restaurées par l'atelier.",
                href: "/velos",
              },
              {
                title: "Vêtements & Accessoires",
                description:
                  "Casques, chaussures, lunettes, gants, sacs et textile.",
                href: "/equipement",
              },
              {
                title: "Personnalisation",
                description:
                  "Composez votre projet de peinture et recevez une estimation immédiate.",
                href: "/personnalisation",
              },
              {
                title: "À propos",
                description:
                  "L'histoire, l'atelier, la méthode et les réalisations.",
                href: "/a-propos",
              },
            ]}
          />
        </RevealGroup>
      </Section>

      {/* Produits mis en avant */}
      {featured.length > 0 && (
        <Section
          eyebrow={text(content, "home.featured.eyebrow")}
          title={text(content, "home.featured.title")}
          action={
            <ButtonLink href="/velos" variant="outline">
              Toute la boutique
            </ButtonLink>
          }
        >
          <RevealGroup className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </RevealGroup>
        </Section>
      )}

      {/* Avis clients */}
      {reviewData.length > 0 && (
        <Section muted title={text(content, "home.reviews.title")}>
          <RevealGroup>
            <Reviews reviews={reviewData} />
          </RevealGroup>
        </Section>
      )}

      {/* Instagram */}
      {instagram.length > 0 && (
        <Section
          title={text(content, "home.instagram.title")}
          description={text(content, "home.instagram.handle")}
        >
          <RevealGroup>
            <InstagramGrid
              items={instagram.map((p) => ({
                id: p.id,
                imageUrl: p.imageUrl,
                permalink: p.permalink,
                caption: p.caption,
              }))}
              handle={text(content, "home.instagram.handle")}
            />
          </RevealGroup>
        </Section>
      )}

      {/* Appel à projet */}
      <Section muted className="text-center">
        <Reveal>
          <p className="eyebrow">Atelier</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-balance font-display text-4xl leading-[1.1] md:text-5xl">
            Un projet en tête ? Composons-le ensemble.
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-foreground-muted">
            Choisissez le support, le type de peinture, la finition et les
            options. Vous obtenez une estimation immédiate, puis un devis
            personnalisé après étude de votre projet.
          </p>
          <ButtonLink href="/personnalisation" size="lg" className="mt-11">
            Composer mon projet
          </ButtonLink>
        </Reveal>
      </Section>
    </>
  );
}
