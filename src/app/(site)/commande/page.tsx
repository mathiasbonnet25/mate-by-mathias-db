import { redirect } from "next/navigation";

import { PageIntro } from "@/components/shop/page-intro";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getCartView } from "@/lib/cart";
import { auth } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Commande",
  description: "Finalisez votre commande.",
  path: "/commande",
  noIndex: true,
});

export default async function CommandePage() {
  const cart = await getCartView();
  if (cart.items.length === 0) redirect("/panier");

  const session = await auth();

  return (
    <>
      <PageIntro
        eyebrow="Commande"
        title="Livraison et paiement"
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Panier", path: "/panier" },
          { name: "Commande", path: "/commande" },
        ]}
      />
      <div className="container-page pb-28">
        <CheckoutForm cart={cart} defaultEmail={session?.user?.email} />
      </div>
    </>
  );
}
