import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Confirmation d'inscription",
  description: "Confirmation de votre inscription à la newsletter.",
  path: "/newsletter/confirmation",
  noIndex: true,
});

/** Deuxième volet du double opt-in : validation du jeton reçu par courriel. */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let confirmed = false;

  if (token) {
    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { confirmToken: token },
      });
      if (subscriber) {
        await prisma.newsletterSubscriber.update({
          where: { id: subscriber.id },
          data: {
            isConfirmed: true,
            confirmedAt: new Date(),
            // Le jeton est consommé : le lien ne peut pas être rejoué.
            confirmToken: null,
          },
        });
        confirmed = true;
      }
    } catch {
      confirmed = false;
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-40">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl">
          {confirmed ? "Inscription confirmée" : "Lien invalide ou déjà utilisé"}
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
          {confirmed
            ? "Merci. Vous recevrez les nouvelles de l'atelier quelques fois par an. Un lien de désinscription figure dans chaque message."
            : "Ce lien de confirmation n'est plus valable. Vous pouvez relancer une inscription depuis le pied de page du site."}
        </p>
        <Link
          href="/"
          className="mt-10 inline-block rounded-full border border-line px-9 py-3.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
