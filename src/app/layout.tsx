import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";

import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/shop/cart-provider";
import { CookieConsentProvider } from "@/components/legal/cookie-consent";
import { themeInitScript } from "@/components/ui/theme-toggle";
import { getCartView } from "@/lib/cart";
import { siteUrl } from "@/lib/env";
import { BRAND, TAGLINE, jsonLdScript, organizationJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND} — ${TAGLINE}`,
    template: `%s — ${BRAND}`,
  },
  description:
    "Atelier français de peinture personnalisée, de restauration et de projets sur mesure pour cadres et vélos. Vêtements et accessoires sélectionnés.",
  applicationName: BRAND,
  authors: [{ name: BRAND }],
  creator: BRAND,
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0c" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cart = await getCartView();

  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        {/* Applique le thème avant la première peinture pour éviter un flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(organizationJsonLd()),
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-contrast"
        >
          Aller au contenu principal
        </a>

        <CookieConsentProvider>
          <CartProvider initialCount={cart.count}>
            <Header />
            <main id="contenu">{children}</main>
            <Footer />
          </CartProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
