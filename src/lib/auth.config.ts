import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

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
    /**
     * Le middleware s'exécute sur le runtime edge, sans accès à la base :
     * il ne dispose que du jeton. Ces deux rappels recopient le rôle du
     * jeton vers la session pour que le contrôle d'accès fonctionne aussi
     * bien côté edge que côté serveur. Sans eux, `auth.user.role` y serait
     * toujours indéfini et l'administration deviendrait inaccessible.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled);
      }
      return session;
    },
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
