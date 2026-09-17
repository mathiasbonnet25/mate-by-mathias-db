import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";

import "./globals.css";

import { themeInitScript } from "@/components/ui/theme-toggle";
import { siteUrl } from "@/lib/env";
import { BRAND, TAGLINE, jsonLdScript, organizationJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
});

// Seules les graisses réellement utilisées sont chargées : les titres sont
// en 300, le reste du texte en 400. Charger 500 et 600 « au cas où »
// coûtait une trentaine de kilo-octets sur le chemin critique.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-cormorant",
  display: "swap",
  // Ajuste les métriques de la police de repli pour que la substitution
  // ne provoque aucun décalage de mise en page.
  adjustFontFallback: true,
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

/**
 * Enveloppe minimale commune au site public et à l'administration :
 * polices, thème et données structurées. Chaque univers apporte ensuite
 * son propre habillage.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable}`}
    >
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
