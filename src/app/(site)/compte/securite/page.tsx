import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { PasswordChangeForm } from "@/components/auth/password-change-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Sécurité du compte",
  description: "Mot de passe et double authentification.",
  path: "/compte/securite",
  noIndex: true,
});

export default async function SecuritePage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { twoFactorEnabled: true, lastLoginAt: true, createdAt: true },
  });

  return (
    <div className="space-y-14">
      <section>
        <h2 className="font-display text-2xl">Double authentification</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Vivement recommandée, et obligatoire pour les comptes
          d&apos;administration.
        </p>
        <div className="mt-6">
          <TwoFactorSetup enabled={Boolean(user?.twoFactorEnabled)} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Mot de passe</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Douze caractères minimum. Une phrase de passe longue vaut mieux
          qu&apos;un mot court et compliqué.
        </p>
        <div className="mt-6">
          <PasswordChangeForm />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Activité</h2>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between border-b border-line py-3">
            <dt className="text-foreground-muted">Compte créé le</dt>
            <dd>{user?.createdAt ? formatDateTime(user.createdAt) : "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-line py-3">
            <dt className="text-foreground-muted">Dernière connexion</dt>
            <dd>{user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
