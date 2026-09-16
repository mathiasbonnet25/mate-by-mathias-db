import { redirect } from "next/navigation";

import { AdminHeader, Card } from "@/components/admin/ui";
import { UserRoles, type UserRow } from "@/components/admin/user-roles";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage() {
  const session = await auth();
  // Page réservée aux administrateurs : les gestionnaires ne doivent pas
  // pouvoir s'attribuer de droits supplémentaires.
  if (session?.user.role !== "ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    where: { anonymizedAt: null },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { _count: { select: { orders: true } } },
  });

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    orderCount: user._count.orders,
    isSelf: user.id === session.user.id,
  }));

  const staffWithoutTwoFactor = rows.filter(
    (u) => u.role !== "CLIENT" && !u.twoFactorEnabled,
  );

  return (
    <>
      <AdminHeader
        title="Utilisateurs"
        description="Attribution des rôles. Un gestionnaire accède au catalogue et aux commandes ; un administrateur peut en plus gérer les comptes."
      />

      {staffWithoutTwoFactor.length > 0 && (
        <p className="mb-4 border border-accent/60 p-4 text-[12px] leading-relaxed">
          {staffWithoutTwoFactor.length} compte(s) disposant d&apos;un accès à
          l&apos;administration n&apos;ont pas activé la double
          authentification. Elle est indispensable : un mot de passe
          compromis suffirait sinon à accéder à l&apos;ensemble des commandes
          et des données clients.
        </p>
      )}

      <Card>
        <UserRoles users={rows} />
      </Card>
    </>
  );
}
