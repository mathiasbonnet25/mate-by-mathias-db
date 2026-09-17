import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Numérotation chronologique des devis, commandes et factures.
 *
 * Pour les factures, l'administration fiscale impose une séquence continue,
 * sans trou ni doublon (art. 242 nonies A de l'annexe II au CGI). Le compteur
 * est donc incrémenté dans une transaction, à partir du dernier numéro
 * réellement présent en base.
 */
type Sequence = "quote" | "order" | "invoice" | "claim";

export async function nextSequenceNumber(
  sequence: Sequence,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  return prisma.$transaction(async (tx) => {
    let last: string | null = null;

    if (sequence === "quote") {
      const row = await tx.quote.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      last = row?.number ?? null;
    } else if (sequence === "order") {
      const row = await tx.order.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      last = row?.number ?? null;
    } else if (sequence === "invoice") {
      const row = await tx.invoice.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      last = row?.number ?? null;
    } else {
      const row = await tx.claim.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      last = row?.number ?? null;
    }

    const lastIndex = last ? Number.parseInt(last.slice(pattern.length), 10) : 0;
    const next = (Number.isFinite(lastIndex) ? lastIndex : 0) + 1;
    return `${pattern}${String(next).padStart(5, "0")}`;
  });
}
