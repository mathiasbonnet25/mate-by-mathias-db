import Link from "next/link";
import { Check, Clock } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Confirmation de commande",
  description: "Votre commande est enregistrée.",
  path: "/commande/confirmation",
  noIndex: true,
});

/**
 * Page de retour après paiement.
 *
 * Elle affiche l'état réel de la commande en base. L'encaissement n'est
 * considéré comme acquis qu'après réception du webhook du prestataire : un
 * simple retour de navigateur ne vaut pas paiement.
 *
 * Accès : le numéro de commande étant séquentiel, il serait énumérable.
 * La commande n'est donc affichée que sur présentation du jeton remis à la
 * fin du paiement, ou au client connecté qui en est propriétaire.
 */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ commande?: string; jeton?: string; paiement?: string }>;
}) {
  const { commande, jeton, paiement } = await searchParams;
  const session = await auth();

  const order =
    commande && (jeton || session?.user?.id)
      ? await prisma.order
          .findFirst({
            where: {
              number: commande,
              OR: [
                ...(jeton ? [{ accessToken: jeton }] : []),
                ...(session?.user?.id ? [{ userId: session.user.id }] : []),
              ],
            },
            select: {
              number: true,
              totalCents: true,
              paymentStatus: true,
              createdAt: true,
            },
          })
          .catch(() => null)
      : null;

  const paid = order?.paymentStatus === "PAID";

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-40">
      <div className="max-w-xl text-center">
        <span
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full border ${
            paid ? "border-accent text-accent" : "border-line text-foreground-muted"
          }`}
        >
          {paid ? (
            <Check className="h-7 w-7" aria-hidden />
          ) : (
            <Clock className="h-7 w-7" aria-hidden />
          )}
        </span>

        <h1 className="mt-9 font-display text-4xl">
          {paid ? "Merci pour votre commande" : "Commande enregistrée"}
        </h1>

        {order ? (
          <>
            <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
              Votre commande <strong className="text-foreground">{order.number}</strong>{" "}
              d&apos;un montant de {formatPrice(order.totalCents)} TTC est
              enregistrée.{" "}
              {paid
                ? "Un courriel de confirmation vient de vous être envoyé, accompagné de votre facture."
                : "Le paiement est en cours de vérification auprès de notre prestataire. Vous recevrez la confirmation par courriel dès qu'il sera validé."}
            </p>

            {paiement === "indisponible" && (
              <p className="mx-auto mt-6 max-w-md border border-line p-4 text-[12px] leading-relaxed text-foreground-muted">
                Le module de paiement n&apos;est pas configuré sur cet
                environnement. La commande a bien été créée et reste en attente
                de règlement.
              </p>
            )}
          </>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
            Nous n&apos;avons pas retrouvé cette commande. Si vous avez été
            débité, contactez-nous en indiquant votre adresse électronique.
          </p>
        )}

        <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/compte/commandes"
            className="h-12 border border-line px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Suivre ma commande
          </Link>
          <Link
            href="/"
            className="h-12 bg-accent px-8 text-[11px] uppercase leading-[3rem] tracking-[0.18em] text-accent-contrast transition-all hover:brightness-110"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
