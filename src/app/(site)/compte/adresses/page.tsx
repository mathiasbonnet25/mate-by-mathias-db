import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mes adresses",
  description: "Vos adresses de livraison et de facturation.",
  path: "/compte/adresses",
  noIndex: true,
});

export default async function AdressesPage() {
  const session = await auth();

  const addresses = await prisma.address.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl">Mes adresses</h2>
        <p className="mt-3 text-sm text-foreground-muted">
          Les adresses enregistrées lors de vos commandes précédentes. Vous
          pouvez en saisir une nouvelle à chaque commande.
        </p>
      </div>

      {addresses.length === 0 ? (
        <p className="border border-line p-8 text-sm text-foreground-muted">
          Aucune adresse enregistrée pour le moment.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="border border-line p-6">
              <p className="text-[11px] uppercase tracking-[0.14em] text-accent">
                {address.type === "SHIPPING" ? "Livraison" : "Facturation"}
                {address.isDefault ? " · par défaut" : ""}
              </p>
              <address className="mt-4 text-sm not-italic leading-relaxed text-foreground-muted">
                {address.firstName} {address.lastName}
                {address.company && (
                  <>
                    <br />
                    {address.company}
                  </>
                )}
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.postalCode} {address.city}
                <br />
                {address.country}
                {address.phone && (
                  <>
                    <br />
                    {address.phone}
                  </>
                )}
              </address>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
