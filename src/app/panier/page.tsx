import { PageIntro } from "@/components/shop/page-intro";
import { CartView } from "@/components/shop/cart-view";
import { getCartView } from "@/lib/cart";
import { buildMetadata } from "@/lib/seo";

// Le panier dépend du cookie de session : il ne doit jamais être mis en cache.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Panier",
  description: "Votre panier Mate by Mathias.",
  path: "/panier",
  noIndex: true,
});

export default async function PanierPage() {
  const cart = await getCartView();

  return (
    <>
      <PageIntro
        eyebrow="Commande"
        title="Votre panier"
        breadcrumb={[
          { name: "Accueil", path: "/" },
          { name: "Panier", path: "/panier" },
        ]}
      />
      <div className="container-page pb-28">
        <CartView cart={cart} />
      </div>
    </>
  );
}
