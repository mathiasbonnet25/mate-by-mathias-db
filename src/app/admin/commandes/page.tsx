import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";

import { AdminHeader, Card, EmptyState, Badge } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Commandes" };

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function toneFor(status: OrderStatus) {
  if (status === "CANCELLED" || status === "REFUNDED") return "danger" as const;
  if (status === "DELIVERED") return "success" as const;
  if (status === "PENDING_PAYMENT") return "neutral" as const;
  return "accent" as const;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const perPage = 25;

  const status = STATUSES.includes(params.statut as OrderStatus)
    ? (params.statut as OrderStatus)
    : undefined;

  const query = params.q?.trim().slice(0, 120);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { trackingNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { items: { select: { quantity: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <AdminHeader
        title="Commandes"
        description={`${total} commande${total > 1 ? "s" : ""} au total.`}
      />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-4" method="get">
          <label className="min-w-56 flex-1">
            <span className="eyebrow">Recherche</span>
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Numéro, courriel ou suivi"
              className="mt-2 h-11 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            />
          </label>

          <label>
            <span className="eyebrow">Statut</span>
            <select
              name="statut"
              defaultValue={status ?? ""}
              className="mt-2 h-11 border border-line bg-transparent px-4 text-sm outline-none focus:border-accent"
            >
              <option value="">Tous</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="h-11 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Filtrer
          </button>

          {(status || query) && (
            <Link
              href="/admin/commandes"
              className="pb-3 text-[11px] uppercase tracking-[0.14em] text-foreground-muted hover:text-accent"
            >
              Réinitialiser
            </Link>
          )}
        </form>
      </Card>

      <Card>
        {orders.length === 0 ? (
          <EmptyState message="Aucune commande ne correspond à ces critères." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <Th>Numéro</Th>
                  <Th>Date</Th>
                  <Th>Client</Th>
                  <Th>Articles</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line last:border-0 transition-colors hover:bg-surface-muted"
                  >
                    <td className="py-3.5 pr-4">
                      <Link
                        href={`/admin/commandes/${order.number}`}
                        className="hover:text-accent"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-foreground-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-foreground-muted">
                      {order.email}
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-foreground-muted">
                      {order.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge tone={toneFor(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      {formatPrice(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <nav className="mt-7 flex gap-2" aria-label="Pagination">
            {Array.from({ length: pageCount }).map((_, i) => {
              const target = i + 1;
              const search = new URLSearchParams();
              if (status) search.set("statut", status);
              if (query) search.set("q", query);
              search.set("page", String(target));
              return (
                <Link
                  key={target}
                  href={`/admin/commandes?${search.toString()}`}
                  aria-current={target === page ? "page" : undefined}
                  className={`grid h-9 w-9 place-items-center border text-[12px] ${
                    target === page
                      ? "border-accent bg-accent text-accent-contrast"
                      : "border-line hover:border-accent"
                  }`}
                >
                  {target}
                </Link>
              );
            })}
          </nav>
        )}
      </Card>
    </>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`pb-3 pr-4 text-[10px] font-normal uppercase tracking-[0.14em] text-foreground-muted ${className ?? ""}`}
    >
      {children}
    </th>
  );
}
