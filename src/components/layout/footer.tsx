import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { CookiePreferencesButton } from "@/components/legal/cookie-consent";

const SHOP_LINKS = [
  { label: "Cadres & Vélos", href: "/velos" },
  { label: "Vêtements & Accessoires", href: "/equipement" },
  { label: "Atelier personnalisation", href: "/personnalisation" },
  { label: "Livraison & retours", href: "/livraison" },
];

const HOUSE_LINKS = [
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
  { label: "Questions fréquentes", href: "/faq" },
  { label: "Mon compte", href: "/compte" },
];

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Conditions générales de vente", href: "/cgv" },
  { label: "Politique de confidentialité", href: "/confidentialite" },
  { label: "Politique de cookies", href: "/cookies" },
  { label: "Droit de rétractation", href: "/retractation" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "Facebook", href: "https://facebook.com", Icon: Facebook },
  { label: "YouTube", href: "https://youtube.com", Icon: Youtube },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="container-page py-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-6 text-sm leading-relaxed text-foreground-muted">
              Atelier de peinture et de restauration de vélos. Chaque cadre est
              préparé, peint et verni à la main, pièce par pièce.
            </p>
            <div className="mt-7 flex items-center gap-4">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line text-foreground-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
              <a
                href="mailto:contact@matebymathias.fr"
                aria-label="Nous écrire"
                className="grid h-10 w-10 place-items-center rounded-full border border-line text-foreground-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <FooterColumn title="Boutique" links={SHOP_LINKS} />
          <FooterColumn title="La maison" links={HOUSE_LINKS} />

          <div>
            <h2 className="eyebrow">Newsletter</h2>
            <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
              Les nouvelles réalisations de l&apos;atelier, quelques fois par an.
              Rien d&apos;autre.
            </p>
            <NewsletterForm className="mt-5" />
          </div>
        </div>

        <div className="rule-gold my-14" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.16em] text-foreground-muted transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesButton className="text-[11px] uppercase tracking-[0.16em] text-foreground-muted transition-colors hover:text-accent" />
            </li>
          </ul>
          <p className="text-[11px] text-foreground-muted">
            © {new Date().getFullYear()} Mate by Mathias — Tous droits réservés.
          </p>
        </div>

        <p className="mt-8 max-w-3xl text-[11px] leading-relaxed text-foreground-muted">
          Paiement sécurisé par Stripe et PayPal. Le site ne conserve aucun
          numéro de carte bancaire. Garantie légale de conformité de 2 ans et
          garantie contre les vices cachés : voir nos{" "}
          <Link href="/cgv" className="underline hover:text-accent">
            conditions générales de vente
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="eyebrow">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-foreground-muted transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
