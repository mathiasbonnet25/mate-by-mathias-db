import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Ces chemins sont personnels ou sans intérêt pour l'indexation.
        disallow: [
          "/admin",
          "/compte",
          "/panier",
          "/commande",
          "/api/",
          "/connexion",
          "/inscription",
          "/newsletter/confirmation",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
