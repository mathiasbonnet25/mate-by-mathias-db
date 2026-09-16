import { PrismaClient } from "@prisma/client";

/**
 * Instance unique de Prisma. En développement, Next.js recharge les modules
 * à chaque modification : sans ce cache global on épuiserait le pool de
 * connexions PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
