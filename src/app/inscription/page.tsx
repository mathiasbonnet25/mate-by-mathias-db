import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Logo } from "@/components/layout/logo";
import { auth } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Créer un compte",
  description: "Créez votre compte Mate by Mathias.",
  path: "/inscription",
  noIndex: true,
});

export default async function InscriptionPage() {
  const session = await auth();
  if (session?.user) redirect("/compte");

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md">
        <div className="mb-12 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center font-display text-4xl">Créer un compte</h1>
        <p className="mt-3 text-center text-sm text-foreground-muted">
          Suivez vos commandes et retrouvez vos projets d&apos;atelier.
        </p>
        <div className="mt-10">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
