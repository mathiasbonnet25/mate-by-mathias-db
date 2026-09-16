import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Reveal } from "@/components/ui/reveal";

const NAV = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/devis", label: "Mes devis" },
  { href: "/compte/favoris", label: "Mes favoris" },
  { href: "/compte/adresses", label: "Mes adresses" },
  { href: "/compte/securite", label: "Sécurité" },
  { href: "/compte/donnees", label: "Mes données" },
];

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/compte");

  return (
    <div className="container-page pb-28 pt-[132px] md:pt-[168px]">
      <Reveal>
        <p className="eyebrow">Mon espace</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05]">
          Bonjour{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <div className="rule-gold mt-10" />
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="Navigation de mon compte">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-l-2 border-transparent py-2.5 pl-4 text-[13px] text-foreground-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-8 border-t border-line pt-8"
          >
            <button
              type="submit"
              className="text-[11px] uppercase tracking-[0.16em] text-foreground-muted transition-colors hover:text-accent"
            >
              Se déconnecter
            </button>
          </form>
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}
