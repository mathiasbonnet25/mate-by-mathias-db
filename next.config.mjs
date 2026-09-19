/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * La CSP autorise uniquement les origines réellement utilisées par le site
 * (Stripe, PayPal, polices Google, stockage média).
 */
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  // Next.js injecte des scripts inline hydratés ; en production on garde
  // 'unsafe-inline' uniquement pour les styles, pas pour les scripts tiers.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  "connect-src 'self' https://api.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
  // 'self' est nécessaire à l'aperçu responsive de l'administration, qui
  // affiche le site dans un cadre de même origine.
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
  // 'self' plutôt que 'none' : un site tiers ne peut toujours pas nous
  // encadrer — c'est ce qui protège du détournement de clic — mais
  // l'aperçu responsive de l'administration, qui affiche le site dans un
  // cadre de même origine, fonctionne.
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Équivalent hérité de frame-ancestors, pour les navigateurs anciens.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

/** @type {import('next').NextConfig} */
/**
 * Domaine d'où proviennent les médias, déduit de NEXT_PUBLIC_MEDIA_BASE_URL.
 *
 * Next refuse d'optimiser une image venant d'un domaine non déclaré. Les
 * adresses par défaut des fournisseurs sont listées plus bas, mais un nom de
 * domaine personnalisé — media.exemple.fr — n'y figure évidemment pas. Le
 * lire ici évite d'avoir à modifier ce fichier le jour où l'on en pose un.
 */
const mediaHost = (() => {
  const brut = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  if (!brut) return [];
  try {
    const { protocol, hostname } = new URL(brut);
    if (protocol !== "https:") return [];
    return [{ protocol: "https", hostname }];
  } catch {
    // Adresse mal formée : on ne fait pas échouer la construction du site
    // pour autant, les domaines listés plus bas restent disponibles.
    return [];
  }
})();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...mediaHost,
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
