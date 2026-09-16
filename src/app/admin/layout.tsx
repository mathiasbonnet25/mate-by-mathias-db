import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  FileText,
  Type,
  Image as ImageIcon,
  BarChart3,
  ShieldCheck,
  Users,
  Monitor,
  ExternalLink,
} from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";

const NAV = [
  { href: "/admin", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/admin/commandes", label: "Commandes", Icon: ShoppingCart },
  { href: "/admin/devis", label: "Devis", Icon: FileText },
  { href: "/admin/produits", label: "Produits", Icon: Package },
  { href: "/admin/categories", label: "Catégories", Icon: FolderTree },
  { href: "/admin/contenu", label: "Contenu", Icon: Type },
  { href: "/admin/medias", label: "Médias", Icon: ImageIcon },
  { href: "/admin/statistiques", label: "Statistiques", Icon: BarChart3 },
  { href: "/admin/apercu", label: "Aperçu responsive", Icon: Monitor },
  { href: "/admin/conformite", label: "Conformité", Icon: ShieldCheck },
  { href: "/admin/utilisateurs", label: "Utilisateurs", Icon: Users, adminOnly: true },
];

/**
 * Administration.
 *
 * L'accès est contrôlé à trois niveaux : le middleware (edge), ce layout
 * (rendu serveur) et chaque action sensible. Cette redondance évite qu'une
 * erreur de configuration de route n'expose l'ensemble.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/connexion?suite=/admin");
  if (session.user.role !== "ADMIN" && session.user.role !== "GESTIONNAIRE") {
    redirect("/");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-line p-6">
              <Logo />
              <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-accent">
                Administration
              </p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4" aria-label="Administration">
              <ul className="space-y-0.5">
                {NAV.filter((item) => !item.adminOnly || isAdmin).map(
                  ({ href, label, Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-foreground-muted transition-colors hover:bg-surface-muted hover:text-accent"
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            <div className="border-t border-line p-4">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Voir le site
              </Link>

              <div className="mt-3 border-t border-line px-3 pt-3">
                <p className="truncate text-[12px]">{session.user.email}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-accent">
                  {isAdmin ? "Administrateur" : "Gestionnaire"}
                </p>
                {!session.user.twoFactorEnabled && (
                  <Link
                    href="/compte/securite"
                    className="mt-3 block border border-accent/50 p-2.5 text-[10px] leading-relaxed text-accent"
                  >
                    Double authentification inactive. Activez-la pour protéger
                    l&apos;administration.
                  </Link>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-accent"
                  >
                    Se déconnecter
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Navigation repliée sur petit écran */}
          <nav
            className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-line bg-surface px-4 py-3 lg:hidden"
            aria-label="Administration"
          >
            {NAV.filter((item) => !item.adminOnly || isAdmin).map(
              ({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="shrink-0 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
                >
                  {label}
                </Link>
              ),
            )}
          </nav>

          <main className="p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
