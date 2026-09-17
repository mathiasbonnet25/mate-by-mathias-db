import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/shop/cart-provider";
import { CookieConsentProvider } from "@/components/legal/cookie-consent";
import { AudienceTracker } from "@/components/legal/audience-tracker";
import { MotionProvider } from "@/components/ui/motion-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PageTransition } from "@/components/ui/page-transition";

/**
 * Habillage du site public : en-tête, pied de page, panier, notifications,
 * gestion du consentement et mesure d'audience.
 *
 * Ce composant ne lit aucune donnée personnelle : le compteur du panier est
 * récupéré par le navigateur. Les pages publiques restent ainsi servies
 * depuis le cache, au lieu d'être recalculées à chaque visite.
 *
 * L'ordre des fournisseurs compte : le panier émet des notifications, il
 * doit donc se trouver à l'intérieur de `ToastProvider`.
 *
 * L'administration possède son propre habillage et ne passe donc pas par
 * ici : elle n'affiche ni le menu de la boutique, ni le bandeau cookies,
 * et ne déclenche aucune mesure d'audience.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <ToastProvider>
        <CookieConsentProvider>
          <CartProvider>
            <a
              href="#contenu"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-accent-contrast"
            >
              Aller au contenu principal
            </a>

            <Header />

            <main id="contenu">
              <PageTransition>{children}</PageTransition>
            </main>

            <Footer />
            <AudienceTracker />
          </CartProvider>
        </CookieConsentProvider>
      </ToastProvider>
    </MotionProvider>
  );
}
