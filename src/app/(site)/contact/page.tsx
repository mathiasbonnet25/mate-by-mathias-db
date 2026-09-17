import { PageIntro } from "@/components/shop/page-intro";
import { ContactForm } from "@/components/layout/contact-form";
import { Reveal } from "@/components/ui/reveal";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contacter l'atelier Mate by Mathias : questions, service après-vente, réclamations et demandes relatives aux données personnelles.",
  path: "/contact",
});

export default async function ContactPage() {
  const c = await getContent();

  return (
    <>
      <PageIntro
        eyebrow="Écrire à l'atelier"
        title="Contact"
        description="Une question sur un produit, un projet en tête, un souci après livraison ? Écrivez-moi, je réponds sous deux jours ouvrés."
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />

      <div className="container-page pb-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_320px] lg:gap-20">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={0.1}>
            <aside className="space-y-9 rounded-lg border border-line p-7">
              <div>
                <h2 className="eyebrow">Courriel</h2>
                <a
                  href={`mailto:${c["contact.email"]}`}
                  className="mt-3 block text-sm transition-colors hover:text-accent"
                >
                  {c["contact.email"]}
                </a>
              </div>

              {c["contact.phone"] && (
                <div>
                  <h2 className="eyebrow">Téléphone</h2>
                  <a
                    href={`tel:${c["contact.phone"].replace(/\s/g, "")}`}
                    className="mt-3 block text-sm transition-colors hover:text-accent"
                  >
                    {c["contact.phone"]}
                  </a>
                </div>
              )}

              {c["contact.address"] && (
                <div>
                  <h2 className="eyebrow">Atelier</h2>
                  <p className="mt-3 whitespace-pre-line text-sm text-foreground-muted">
                    {c["contact.address"]}
                  </p>
                  <p className="mt-2 text-[11px] text-foreground-muted">
                    Visites sur rendez-vous uniquement.
                  </p>
                </div>
              )}

              <div className="border-t border-line pt-7">
                <h2 className="eyebrow">Réclamations</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-foreground-muted">
                  Nous accusons réception de toute réclamation sous 48 heures
                  ouvrées. À défaut de solution amiable, vous pouvez recourir
                  gratuitement à un médiateur de la consommation : voir
                  l&apos;article 11 des{" "}
                  <a href="/cgv" className="underline hover:text-accent">
                    conditions générales de vente
                  </a>
                  .
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </>
  );
}
