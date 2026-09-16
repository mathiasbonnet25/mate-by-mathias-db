import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/layout/logo";
import { auth } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Connexion",
  description: "Accédez à votre compte Mate by Mathias.",
  path: "/connexion",
  noIndex: true,
});

export default async function ConnexionPage() {
  const session = await auth();
  if (session?.user) redirect("/compte");

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md">
        <div className="mb-12 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center font-display text-4xl">Connexion</h1>
        <p className="mt-3 text-center text-sm text-foreground-muted">
          Accédez à vos commandes, vos devis et vos favoris.
        </p>
        <div className="mt-10">
          <Suspense fallback={<div className="h-80" />}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
