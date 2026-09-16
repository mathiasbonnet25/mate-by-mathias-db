import type { NextAuthConfig } from "next-auth";

/**
 * Configuration compatible « edge » : elle ne doit importer ni Prisma ni
 * aucune dépendance Node, car le middleware s'exécute sur le runtime edge.
 * La logique d'authentification réelle vit dans src/lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  session: {
    // Stratégie JWT : imposée par le fournisseur « credentials ».
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-mbm.session"
          : "mbm.session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const role = auth?.user?.role;
      const path = request.nextUrl.pathname;

      if (path.startsWith("/admin")) {
        return role === "ADMIN" || role === "GESTIONNAIRE";
      }
      if (path.startsWith("/compte")) {
        return Boolean(auth?.user);
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
