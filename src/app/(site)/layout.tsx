import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/shop/cart-provider";
import { CookieConsentProvider } from "@/components/legal/cookie-consent";
import { AudienceTracker } from "@/components/legal/audience-tracker";
import { getCartView } from "@/lib/cart";

/**
 * Habillage du site public : en-tête, pied de page, panier, gestion du
 * consentement et mesure d'audience.
 *
 * L'administration possède son propre habillage et ne passe donc pas par
 * ici : elle n'affiche ni le menu de la boutique, ni le bandeau cookies,
 * et ne déclenche aucune mesure d'audience.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cart = await getCartView();

  return (
    <CookieConsentProvider>
      <CartProvider initialCount={cart.count}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-contrast"
        >
          Aller au contenu principal
        </a>

        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <AudienceTracker />
      </CartProvider>
    </CookieConsentProvider>
  );
}
