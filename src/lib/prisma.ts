import { PrismaClient } from "@prisma/client";

import { databaseUrl } from "@/lib/database-url";

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
    // L'adresse est passée ici plutôt que laissée au « env("DATABASE_URL") »
    // du schéma : celui-ci ne lit qu'une variable, alors que l'hébergeur
    // peut en renseigner une autre de son propre chef.
    datasourceUrl: databaseUrl(),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
