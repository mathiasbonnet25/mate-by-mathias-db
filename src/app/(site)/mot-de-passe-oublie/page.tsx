import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Mot de passe oublié",
  description: "Réinitialiser le mot de passe de votre compte.",
  path: "/mot-de-passe-oublie",
  noIndex: true,
});

/**
 * La réinitialisation par lien à usage unique reste à brancher sur le
 * service d'envoi. En attendant, la page oriente vers un contact humain
 * plutôt que d'exposer un formulaire qui ne ferait rien.
 */
export default function MotDePasseOubliePage() {
  return (
    <div className="container-page flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md text-center">
        <div className="mb-12 flex justify-center">
          <Logo />
        </div>
        <h1 className="font-display text-4xl">Mot de passe oublié</h1>
        <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
          La réinitialisation automatique par courriel n&apos;est pas encore
          active sur cet environnement. Écrivez-nous depuis la page de contact
          en indiquant l&apos;adresse de votre compte : nous vous enverrons un
          lien de réinitialisation après vérification.
        </p>
        <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="rounded-full h-12 bg-foreground px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Nous contacter
          </Link>
          <Link
            href="/connexion"
            className="h-12 rounded-full border border-line px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
