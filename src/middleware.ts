import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Protège l'administration et l'espace client, et pose l'en-tête
 * Vary sur les réponses personnalisées pour éviter toute mise en cache
 * partagée d'une page authentifiée.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/compte");

  if (!isProtected) return NextResponse.next();

  if (!req.auth?.user) {
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("suite", pathname);
    return NextResponse.redirect(url);
  }

  const role = req.auth.user.role;
  if (
    pathname.startsWith("/admin") &&
    role !== "ADMIN" &&
    role !== "GESTIONNAIRE"
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "private, no-store");
  return res;
});

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
